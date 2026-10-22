-- N83a: reserva INTERNA de finalistas (so o recrutador ve).
-- Quem esta na etapa Final pode ficar como opcao caso o 1o candidato nao aceite.
-- O candidato nunca ouve "reserva": para ele, o aviso e uma atualizacao comum
-- ("Voce esta na fase final do processo seletivo. O proximo retorno sai ate DD/MM"),
-- gravada em feedbacks como kind = 'update'. A etapa nao muda.
-- Regras: o aviso conta como retorno dado (fecha o prazo aberto no prazo) e abre um
-- prazo ate a validade (14 dias); 1 renovacao avisada; se ninguem agir ate a data,
-- o prazo vence e conta como atraso na meta. Mudar de etapa encerra a reserva.
-- O encerramento da vaga (N64) ja exige o retorno final de quem esta na Final.

create or replace function public.reserve_days()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 14;
$$;

create or replace function public.max_reserve_renewals()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 1;
$$;

revoke all on function public.reserve_days() from public, anon;
grant execute on function public.reserve_days() to authenticated;
revoke all on function public.max_reserve_renewals() from public, anon;
grant execute on function public.max_reserve_renewals() to authenticated;

create table public.application_reserves (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  reserved_by uuid references auth.users (id) on delete set null,
  reserved_at timestamptz not null default now(),
  valid_until timestamptz not null,
  renewals smallint not null default 0,
  ended_at timestamptz,
  -- Etapa para onde a candidatura foi quando a reserva acabou (approved, rejected...).
  end_stage public.application_status,
  created_at timestamptz not null default now(),
  constraint application_reserves_renewals_check check (renewals >= 0),
  constraint application_reserves_end_check check ((ended_at is null) = (end_stage is null))
);

create unique index application_reserves_one_active_idx
  on public.application_reserves (application_id) where ended_at is null;
create index application_reserves_application_idx
  on public.application_reserves (application_id, created_at desc);

-- So o recrutador da vaga le. O candidato NAO le esta tabela (a reserva e interna).
alter table public.application_reserves enable row level security;
revoke all on public.application_reserves from public, anon, authenticated;
grant select on public.application_reserves to authenticated;

create policy "Recruiters read reserves of own jobs"
  on public.application_reserves for select to authenticated
  using (exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.id = application_reserves.application_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ));

-- Fecha o prazo aberto, grava o aviso ao candidato (kind update) e abre o prazo
-- ate _due_at, mantendo o contador de adiamentos da etapa.
create or replace function public.reserve_notice_and_deadline(
  _application_id uuid,
  _author_id uuid,
  _stage public.application_status,
  _message text,
  _due_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_postpone_no smallint := 0;
begin
  update public.feedback_deadlines
  set met_at = now()
  where application_id = _application_id and met_at is null
  returning postpone_no into v_postpone_no;

  insert into public.feedbacks (
    application_id, author_id, content, kind, sent_to_candidate_at
  ) values (_application_id, _author_id, _message, 'update', now());

  update public.applications
  set feedback_sent_at = now()
  where id = _application_id;

  insert into public.feedback_deadlines (application_id, stage, due_at, postpone_no)
  values (_application_id, _stage, _due_at, coalesce(v_postpone_no, 0));
end;
$$;

revoke all on function public.reserve_notice_and_deadline(
  uuid, uuid, public.application_status, text, timestamptz
) from public, anon, authenticated;

-- Confere recrutador aprovado, dono da vaga, e devolve a etapa (com lock na candidatura).
create or replace function public.lock_own_application_stage(_application_id uuid)
returns public.application_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_stage public.application_status;
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

  return v_stage;
end;
$$;

revoke all on function public.lock_own_application_stage(uuid)
  from public, anon, authenticated;

create or replace function public.put_on_reserve(
  _application_id uuid,
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
  v_message text := btrim(coalesce(_message, ''));
  v_valid_until timestamptz := now() + make_interval(days => public.reserve_days());
begin
  v_stage := public.lock_own_application_stage(_application_id);

  if v_stage <> 'final_interview' then
    raise exception 'stage_not_final' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.application_reserves
    where application_id = _application_id and ended_at is null
  ) then
    raise exception 'already_reserved' using errcode = 'P0001';
  end if;
  if char_length(v_message) < 10 or char_length(v_message) > 1000 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;

  perform public.reserve_notice_and_deadline(
    _application_id, v_uid, v_stage, v_message, v_valid_until
  );

  insert into public.application_reserves (application_id, reserved_by, valid_until)
  values (_application_id, v_uid, v_valid_until);

  return v_valid_until;
end;
$$;

create or replace function public.renew_reserve(
  _application_id uuid,
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
  v_reserve public.application_reserves%rowtype;
  v_message text := btrim(coalesce(_message, ''));
  v_valid_until timestamptz := now() + make_interval(days => public.reserve_days());
begin
  v_stage := public.lock_own_application_stage(_application_id);

  select * into v_reserve
  from public.application_reserves
  where application_id = _application_id and ended_at is null
  for update;

  if not found then
    raise exception 'not_reserved' using errcode = 'P0001';
  end if;
  if v_reserve.renewals >= public.max_reserve_renewals() then
    raise exception 'renewal_limit_reached' using errcode = 'P0001';
  end if;
  if char_length(v_message) < 10 or char_length(v_message) > 1000 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;

  perform public.reserve_notice_and_deadline(
    _application_id, v_uid, v_stage, v_message, v_valid_until
  );

  update public.application_reserves
  set valid_until = v_valid_until,
      renewals = renewals + 1
  where id = v_reserve.id;

  return v_valid_until;
end;
$$;

revoke all on function public.put_on_reserve(uuid, text) from public, anon;
grant execute on function public.put_on_reserve(uuid, text) to authenticated;
revoke all on function public.renew_reserve(uuid, text) from public, anon;
grant execute on function public.renew_reserve(uuid, text) to authenticated;

-- Mudar de etapa (aprovado, rejeitado, desistiu) encerra a reserva.
create or replace function public.end_reserve_on_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.current_stage is distinct from old.current_stage then
    update public.application_reserves
    set ended_at = now(), end_stage = new.current_stage
    where application_id = new.id and ended_at is null;
  end if;
  return new;
end;
$$;

revoke all on function public.end_reserve_on_stage_change()
  from public, anon, authenticated;

create trigger applications_end_reserve
  after update of current_stage on public.applications
  for each row execute function public.end_reserve_on_stage_change();
