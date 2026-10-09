-- N63: prazo de retorno por candidato (decisao de 08/10/2026).
--
-- Todo candidato ativo (Em analise, Triagem, Entrevista, Final) tem um prazo de
-- retorno aberto. Cumprir = qualquer contato ate a data: mudanca de etapa (o
-- candidato sempre recebe o aviso), feedback de decisao ou atualizacao honesta
-- com nova data (postpone_feedback, no maximo 2 por etapa, de ate 14 dias).
-- "No prazo" = met_at <= due_at; "atrasado" = met_at > due_at, ou prazo ainda
-- aberto com due_at no passado (calculado na leitura, sem job agendado).
-- Base do atingimento da meta (N16) e do selo (N65).
--
-- TODO(N18): acrescentar org_id e a politica por empresa quando a empresa virar a
-- unidade de isolamento.

-- 1) feedbacks ganha o tipo (decisao | atualizacao) e o motivo (N62).
alter table public.feedbacks
  add column if not exists kind text not null default 'decision',
  add column if not exists reason_code text;

alter table public.feedbacks drop constraint if exists feedbacks_kind_check;
alter table public.feedbacks
  add constraint feedbacks_kind_check check (kind in ('decision', 'update'));

alter table public.feedbacks drop constraint if exists feedbacks_reason_code_check;
alter table public.feedbacks
  add constraint feedbacks_reason_code_check check (
    reason_code is null
    or reason_code in (
      'missing_required', 'level_below', 'eliminatory', 'better_fit', 'job_closed'
    )
  );

-- O recrutador nao grava kind nem reason_code direto: a atualizacao honesta passa
-- por postpone_feedback (que aplica o limite) e o lote passa pela edge function.
revoke insert, update on public.feedbacks from authenticated;
grant insert (id, application_id, author_id, content, created_at, sent_to_candidate_at)
  on public.feedbacks to authenticated;
grant update (id, application_id, author_id, content, created_at, sent_to_candidate_at)
  on public.feedbacks to authenticated;

-- 2) Constantes da regra (uma funcao cada, faceis de mudar).
create or replace function public.max_feedback_postpones()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 2;
$$;

create or replace function public.max_feedback_postpone_days()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 14;
$$;

-- Etapas em que o candidato ainda espera retorno.
create or replace function public.is_feedback_deadline_stage(_stage public.application_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select _stage in ('new_application', 'screening', 'interview', 'final_interview');
$$;

revoke all on function public.max_feedback_postpones() from public, anon;
grant execute on function public.max_feedback_postpones() to authenticated;
revoke all on function public.max_feedback_postpone_days() from public, anon;
grant execute on function public.max_feedback_postpone_days() to authenticated;
revoke all on function public.is_feedback_deadline_stage(public.application_status)
  from public, anon;
grant execute on function public.is_feedback_deadline_stage(public.application_status)
  to authenticated;

-- 3) Tabela de prazos: uma linha por prazo. Aberto = met_at nulo.
create table if not exists public.feedback_deadlines (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  stage public.application_status not null,
  due_at timestamptz not null,
  met_at timestamptz,
  postpone_no smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint feedback_deadlines_postpone_no_check check (postpone_no >= 0)
);

-- No maximo um prazo aberto por candidatura.
create unique index if not exists feedback_deadlines_one_open_idx
  on public.feedback_deadlines (application_id) where met_at is null;
create index if not exists feedback_deadlines_application_idx
  on public.feedback_deadlines (application_id, created_at desc);
create index if not exists feedback_deadlines_open_due_idx
  on public.feedback_deadlines (due_at) where met_at is null;

alter table public.feedback_deadlines enable row level security;

revoke all on public.feedback_deadlines from public, anon, authenticated;
grant select on public.feedback_deadlines to authenticated;

drop policy if exists "Candidates read own feedback deadlines" on public.feedback_deadlines;
create policy "Candidates read own feedback deadlines"
  on public.feedback_deadlines for select to authenticated
  using (exists (
    select 1 from public.applications a
    where a.id = feedback_deadlines.application_id
      and a.candidate_id = (select auth.uid())
  ));

drop policy if exists "Recruiters read deadlines of own jobs" on public.feedback_deadlines;
create policy "Recruiters read deadlines of own jobs"
  on public.feedback_deadlines for select to authenticated
  using (exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.id = feedback_deadlines.application_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ));

-- 4) Candidatura criada ou etapa mudada: fecha o prazo aberto (contato) e abre o
-- da nova etapa. Aprovado, Rejeitado e Desistiu nao tem prazo.
create or replace function public.sync_feedback_deadline_on_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.current_stage is not distinct from old.current_stage then
    return new;
  end if;

  update public.feedback_deadlines
  set met_at = now()
  where application_id = new.id and met_at is null;

  if public.is_feedback_deadline_stage(new.current_stage) then
    insert into public.feedback_deadlines (application_id, stage, due_at)
    values (new.id, new.current_stage, now() + public.feedback_sla());
  end if;

  return new;
end;
$$;

-- 5) Feedback de decisao enviado ao candidato: cumpre o prazo aberto. Se a
-- candidatura continua numa etapa com prazo, abre o proximo (+SLA) sem gastar nem
-- zerar os adiamentos. A atualizacao honesta (kind = 'update') e tratada em
-- postpone_feedback.
create or replace function public.close_feedback_deadline_on_feedback()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_open public.feedback_deadlines%rowtype;
  v_stage public.application_status;
begin
  if new.kind <> 'decision' or new.sent_to_candidate_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.sent_to_candidate_at is not null then
    return new;
  end if;

  update public.feedback_deadlines
  set met_at = now()
  where application_id = new.application_id and met_at is null
  returning * into v_open;

  if not found then
    return new;
  end if;

  select a.current_stage into v_stage
  from public.applications a
  where a.id = new.application_id;

  if public.is_feedback_deadline_stage(v_stage) then
    insert into public.feedback_deadlines (application_id, stage, due_at, postpone_no)
    values (new.application_id, v_stage, now() + public.feedback_sla(), v_open.postpone_no);
  end if;

  return new;
end;
$$;

revoke all on function public.sync_feedback_deadline_on_stage()
  from public, anon, authenticated;
revoke all on function public.close_feedback_deadline_on_feedback()
  from public, anon, authenticated;

drop trigger if exists applications_sync_feedback_deadline on public.applications;
create trigger applications_sync_feedback_deadline
  after insert or update of current_stage on public.applications
  for each row execute function public.sync_feedback_deadline_on_stage();

drop trigger if exists feedbacks_close_deadline on public.feedbacks;
create trigger feedbacks_close_deadline
  after insert or update of sent_to_candidate_at on public.feedbacks
  for each row execute function public.close_feedback_deadline_on_feedback();

-- 6) Atualizacao honesta: cumpre o prazo atual, grava a mensagem em feedbacks
-- (kind = 'update', ja enviada ao candidato) e abre outro prazo na nova data.
-- Erros (message): not_allowed (42501), stage_without_deadline, postpone_limit_reached,
-- postpone_too_long (P0001), invalid_message, invalid_due_date (22023).
create or replace function public.postpone_feedback(
  _application_id uuid,
  _new_due_at timestamptz,
  _message text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_stage public.application_status;
  v_open public.feedback_deadlines%rowtype;
  v_postpone_no smallint := 0;
  v_message text := btrim(coalesce(_message, ''));
begin
  if v_uid is null or not public.is_approved_recruiter(v_uid) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select a.current_stage into v_stage
  from public.applications a
  join public.jobs j on j.id = a.job_id
  where a.id = _application_id and j.recruiter_id = v_uid
  for update of a;

  if not found then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if not public.is_feedback_deadline_stage(v_stage) then
    raise exception 'stage_without_deadline' using errcode = 'P0001';
  end if;

  if char_length(v_message) < 10 or char_length(v_message) > 1000 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;

  select * into v_open
  from public.feedback_deadlines
  where application_id = _application_id and met_at is null
  for update;

  if found then
    v_postpone_no := v_open.postpone_no;
  end if;

  if v_postpone_no >= public.max_feedback_postpones() then
    raise exception 'postpone_limit_reached' using errcode = 'P0001';
  end if;

  if _new_due_at is null
     or _new_due_at <= greatest(now(), coalesce(v_open.due_at, now())) then
    raise exception 'invalid_due_date' using errcode = '22023';
  end if;

  if _new_due_at > now() + make_interval(days => public.max_feedback_postpone_days()) then
    raise exception 'postpone_too_long' using errcode = 'P0001';
  end if;

  update public.feedback_deadlines
  set met_at = now()
  where application_id = _application_id and met_at is null;

  insert into public.feedbacks (
    application_id, author_id, content, kind, sent_to_candidate_at
  ) values (_application_id, v_uid, v_message, 'update', now());

  update public.applications
  set feedback_sent_at = now()
  where id = _application_id;

  insert into public.feedback_deadlines (application_id, stage, due_at, postpone_no)
  values (_application_id, v_stage, _new_due_at, v_postpone_no + 1);

  return _new_due_at;
end;
$$;

revoke all on function public.postpone_feedback(uuid, timestamptz, text)
  from public, anon;
grant execute on function public.postpone_feedback(uuid, timestamptz, text)
  to authenticated;

-- 7) Candidaturas que ja existem: o prazo historico (cumprido) e o prazo aberto.
insert into public.feedback_deadlines (application_id, stage, due_at, met_at)
select a.id, a.current_stage, a.last_stage_change_at + public.feedback_sla(), a.feedback_sent_at
from public.applications a
where public.is_feedback_deadline_stage(a.current_stage)
  and a.feedback_sent_at is not null
  and a.feedback_sent_at >= a.last_stage_change_at
  and not exists (
    select 1 from public.feedback_deadlines d where d.application_id = a.id
  );

insert into public.feedback_deadlines (application_id, stage, due_at)
select
  a.id,
  a.current_stage,
  -- Sem retorno desde a ultima mudanca de etapa: continua atrasado de verdade.
  -- Com retorno: novo ciclo de 5 dias a partir desta migration.
  case
    when a.feedback_sent_at is not null and a.feedback_sent_at >= a.last_stage_change_at
      then now() + public.feedback_sla()
    else a.last_stage_change_at + public.feedback_sla()
  end
from public.applications a
where public.is_feedback_deadline_stage(a.current_stage)
  and not exists (
    select 1 from public.feedback_deadlines d
    where d.application_id = a.id and d.met_at is null
  );
