-- N31a: tipos de item do catalogo, papel na vaga e requisitos sim/nao.
--
-- 1) skills.kind: competency (inclui pratica comportamental observavel), tool,
--    requirement (sim/nao, filtra antes do score) e trait (ponto forte, nunca
--    pontua; a lista fechada chega no N96). Coluna text com check, e nao valor
--    novo no enum skill_category: o Postgres nao usa um valor de enum na mesma
--    transacao em que ele foi criado. category (hard/soft) so vale para
--    competency e tool; as soft skills atuais seguem como competency ate o N41.
-- 2) job_skills.role: required (obrigatorio), preferred (desejavel) ou implicit
--    (implicito). mandatory continua, derivado de role, ate a formula v2 (N32);
--    ate la implicito pontua como desejavel.
-- 3) job_requirements: requisitos sim/nao da vaga, com detalhe da recrutadora e
--    a marca "excludente" (eliminatory), escolha da empresa.
-- 4) application_requirement_answers + apply_to_job: a candidatura passa a ser
--    criada so pela funcao, que grava as respostas. Resposta "nao" a um requisito
--    excludente recusa a candidatura na hora, com retorno de motivo ligado a vaga.
--    Essa candidatura nunca ficou ativa: sem prazo, fora da meta e do selo.
--
-- TODO(N18): job_requirements e application_requirement_answers ganham org_id
-- (ou company_id pelo NOVO-6) quando a empresa virar a unidade de isolamento.

-- ---------------------------------------------------------------------
-- 1) Tipo do item no catalogo
-- ---------------------------------------------------------------------

alter table public.skills
  add column if not exists kind text not null default 'competency';

alter table public.skills drop constraint if exists skills_kind_check;
alter table public.skills
  add constraint skills_kind_check
  check (kind in ('competency', 'tool', 'requirement', 'trait'));

comment on column public.skills.kind is
  'Tipo do item: competency, tool, requirement (sim/nao) ou trait (fora do score). N31.';

-- Ferramentas do catalogo atual (so as que existem; o N41 refaz o catalogo).
update public.skills
set kind = 'tool'
where name in (
  'Docker', 'Kubernetes', 'Kafka', 'RabbitMQ', 'Redis', 'MongoDB', 'Terraform',
  'Cypress', 'Playwright', 'Storybook', 'Vite', 'Webpack',
  'Google Cloud Platform', 'Microsoft Azure', 'AWS', 'Linux', 'Git'
);

-- Requisitos sim/nao comuns. description = pergunta mostrada ao candidato.
insert into public.skills (name, category, kind, description) values
  ('CNH categoria A', 'hard', 'requirement', 'Você tem CNH categoria A válida?'),
  ('CNH categoria B', 'hard', 'requirement', 'Você tem CNH categoria B válida?'),
  ('Trabalho presencial', 'hard', 'requirement', 'Você pode trabalhar presencialmente no local da vaga?'),
  ('Disponibilidade aos fins de semana', 'hard', 'requirement', 'Você pode trabalhar aos sábados, domingos ou feriados?'),
  ('Trabalho em turnos ou escala', 'hard', 'requirement', 'Você pode trabalhar em turnos ou em escala (ex.: 12x36, 6x1)?'),
  ('Disponibilidade para viagens', 'hard', 'requirement', 'Você pode viajar a trabalho?'),
  ('Registro ativo em conselho profissional', 'hard', 'requirement', 'Você tem registro ativo no conselho profissional pedido pela vaga?'),
  ('Início imediato', 'hard', 'requirement', 'Você pode começar imediatamente?')
on conflict (name) do nothing;

-- So competencia e ferramenta pontuam: sao as unicas que entram em job_skills
-- e candidate_skills.
create or replace function public.ensure_scored_skill_kind()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
begin
  select s.kind into v_kind from public.skills s where s.id = new.skill_id;
  if v_kind is not null and v_kind not in ('competency', 'tool') then
    raise exception 'skill_kind_not_scored'
      using errcode = '23514',
            hint = 'Requisito e ponto forte nao entram no score.';
  end if;
  return new;
end;
$$;

revoke all on function public.ensure_scored_skill_kind() from public, anon, authenticated;

drop trigger if exists candidate_skills_scored_kind on public.candidate_skills;
create trigger candidate_skills_scored_kind
  before insert or update of skill_id on public.candidate_skills
  for each row execute function public.ensure_scored_skill_kind();

-- ---------------------------------------------------------------------
-- 2) Papel do item na vaga
-- ---------------------------------------------------------------------

alter table public.job_skills
  add column if not exists role text not null default 'preferred';

alter table public.job_skills drop constraint if exists job_skills_role_check;
alter table public.job_skills
  add constraint job_skills_role_check
  check (role in ('required', 'preferred', 'implicit'));

comment on column public.job_skills.role is
  'Papel na vaga: required (obrigatorio), preferred (desejavel), implicit (implicito). N31.';

update public.job_skills
set role = case when mandatory then 'required' else 'preferred' end;

-- mandatory = (role = required). Cliente antigo que so manda mandatory = true
-- ganha role required.
create or replace function public.prepare_job_skill()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
begin
  select s.kind into v_kind from public.skills s where s.id = new.skill_id;
  if v_kind is not null and v_kind not in ('competency', 'tool') then
    raise exception 'skill_kind_not_scored'
      using errcode = '23514',
            hint = 'Requisito e ponto forte nao entram no score.';
  end if;

  if tg_op = 'INSERT' and new.mandatory and new.role = 'preferred' then
    new.role := 'required';
  elsif tg_op = 'UPDATE'
    and new.mandatory is distinct from old.mandatory
    and new.role is not distinct from old.role then
    new.role := case
      when new.mandatory then 'required'
      when old.role = 'required' then 'preferred'
      else old.role
    end;
  end if;

  new.mandatory := (new.role = 'required');
  return new;
end;
$$;

revoke all on function public.prepare_job_skill() from public, anon, authenticated;

drop trigger if exists job_skills_prepare on public.job_skills;
create trigger job_skills_prepare
  before insert or update on public.job_skills
  for each row execute function public.prepare_job_skill();

-- ---------------------------------------------------------------------
-- 3) Requisitos sim/nao da vaga
-- ---------------------------------------------------------------------

create table if not exists public.job_requirements (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete restrict,
  detail text,
  eliminatory boolean not null default false,
  created_at timestamptz not null default now(),
  constraint job_requirements_detail_check check (detail is null or length(detail) <= 200),
  unique (job_id, skill_id)
);

create index if not exists job_requirements_job_idx on public.job_requirements (job_id);

comment on table public.job_requirements is
  'Requisitos sim/nao da vaga (N31). eliminatory = excludente, escolha da empresa.';

create or replace function public.ensure_requirement_kind()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select s.kind from public.skills s where s.id = new.skill_id) is distinct from 'requirement' then
    raise exception 'skill_kind_not_requirement'
      using errcode = '23514',
            hint = 'So item do tipo requisito entra em job_requirements.';
  end if;
  new.detail := nullif(trim(new.detail), '');
  return new;
end;
$$;

revoke all on function public.ensure_requirement_kind() from public, anon, authenticated;

drop trigger if exists job_requirements_kind on public.job_requirements;
create trigger job_requirements_kind
  before insert or update on public.job_requirements
  for each row execute function public.ensure_requirement_kind();

drop trigger if exists job_requirements_audit on public.job_requirements;
create trigger job_requirements_audit
  after insert or update or delete on public.job_requirements
  for each row execute function public.write_audit_log();

alter table public.job_requirements enable row level security;

revoke all on public.job_requirements from public, anon, authenticated;
grant select, insert, update, delete on public.job_requirements to authenticated;

drop policy if exists "Users read requirements of visible jobs" on public.job_requirements;
create policy "Users read requirements of visible jobs"
  on public.job_requirements for select to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_requirements.job_id
      and (
        j.status = 'active'
        or (j.recruiter_id = (select auth.uid())
          and public.is_approved_recruiter((select auth.uid())))
      )
  ));

drop policy if exists "Approved recruiters manage requirements on own jobs" on public.job_requirements;
create policy "Approved recruiters manage requirements on own jobs"
  on public.job_requirements for all to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_requirements.job_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ))
  with check (exists (
    select 1 from public.jobs j
    where j.id = job_requirements.job_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ));

-- ---------------------------------------------------------------------
-- 4) Respostas do candidato e candidatura pela funcao
-- ---------------------------------------------------------------------

create table if not exists public.application_requirement_answers (
  application_id uuid not null references public.applications (id) on delete cascade,
  requirement_id uuid not null references public.job_requirements (id) on delete cascade,
  meets boolean not null,
  created_at timestamptz not null default now(),
  primary key (application_id, requirement_id)
);

create index if not exists application_requirement_answers_requirement_idx
  on public.application_requirement_answers (requirement_id);

alter table public.application_requirement_answers enable row level security;

revoke all on public.application_requirement_answers from public, anon, authenticated;
grant select on public.application_requirement_answers to authenticated;

drop policy if exists "Candidates read own requirement answers" on public.application_requirement_answers;
create policy "Candidates read own requirement answers"
  on public.application_requirement_answers for select to authenticated
  using (exists (
    select 1 from public.applications a
    where a.id = application_requirement_answers.application_id
      and a.candidate_id = (select auth.uid())
  ));

drop policy if exists "Recruiters read requirement answers of own jobs" on public.application_requirement_answers;
create policy "Recruiters read requirement answers of own jobs"
  on public.application_requirement_answers for select to authenticated
  using (exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.id = application_requirement_answers.application_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ));

-- A candidatura passa a ser criada so por apply_to_job (as respostas vao junto).
revoke insert on public.applications from authenticated;
drop policy if exists "Candidates apply to active jobs" on public.applications;

-- _answers: [{"requirement_id": "<uuid>", "meets": true|false}], uma resposta
-- por requisito da vaga. Devolve a candidatura, se foi criada agora e, se houve
-- recusa imediata, os requisitos excludentes nao atendidos.
-- Erros (message): not_allowed (42501), invalid_answers (22023),
-- job_not_active, requirements_unanswered.
create or replace function public.apply_to_job(_job_id uuid, _answers jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_job public.jobs%rowtype;
  v_app public.applications%rowtype;
  v_unmet text[];
  v_content text;
begin
  if v_uid is null or not public.has_role(v_uid, 'candidate') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if _answers is null or jsonb_typeof(_answers) <> 'array' then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(_answers) a
    where jsonb_typeof(a) <> 'object'
      or jsonb_typeof(a -> 'meets') is distinct from 'boolean'
      or jsonb_typeof(a -> 'requirement_id') is distinct from 'string'
  ) then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;

  select * into v_job
  from public.jobs j
  where j.id = _job_id and j.status = 'active';

  if not found then
    raise exception 'job_not_active' using errcode = 'P0001';
  end if;

  select * into v_app
  from public.applications a
  where a.job_id = _job_id and a.candidate_id = v_uid;

  if found then
    return jsonb_build_object(
      'id', v_app.id, 'job_id', v_app.job_id, 'candidate_id', v_app.candidate_id,
      'match_score', v_app.match_score, 'created_at', v_app.created_at,
      'created', false, 'auto_rejected', false, 'unmet_requirements', '[]'::jsonb
    );
  end if;

  -- Uma resposta para cada requisito da vaga, sem repetir e sem sobrar.
  if (select count(*) from public.job_requirements r where r.job_id = _job_id)
       <> jsonb_array_length(_answers)
    or (select count(distinct a ->> 'requirement_id') from jsonb_array_elements(_answers) a)
       <> jsonb_array_length(_answers)
    or exists (
      select 1 from jsonb_array_elements(_answers) a
      where not exists (
        select 1 from public.job_requirements r
        where r.job_id = _job_id and r.id::text = a ->> 'requirement_id'
      )
    ) then
    raise exception 'requirements_unanswered' using errcode = 'P0001';
  end if;

  insert into public.applications (job_id, candidate_id)
  values (_job_id, v_uid)
  on conflict (job_id, candidate_id) do nothing
  returning * into v_app;

  if not found then
    select * into v_app
    from public.applications a
    where a.job_id = _job_id and a.candidate_id = v_uid;

    return jsonb_build_object(
      'id', v_app.id, 'job_id', v_app.job_id, 'candidate_id', v_app.candidate_id,
      'match_score', v_app.match_score, 'created_at', v_app.created_at,
      'created', false, 'auto_rejected', false, 'unmet_requirements', '[]'::jsonb
    );
  end if;

  insert into public.application_requirement_answers (application_id, requirement_id, meets)
  select v_app.id, (a ->> 'requirement_id')::uuid, (a ->> 'meets')::boolean
  from jsonb_array_elements(_answers) a;

  select array_agg(
           case
             when r.detail is null then s.name
             else s.name || ' (' || r.detail || ')'
           end
           order by s.name
         )
  into v_unmet
  from public.application_requirement_answers ans
  join public.job_requirements r on r.id = ans.requirement_id
  join public.skills s on s.id = r.skill_id
  where ans.application_id = v_app.id
    and r.eliminatory
    and not ans.meets;

  if v_unmet is null then
    return jsonb_build_object(
      'id', v_app.id, 'job_id', v_app.job_id, 'candidate_id', v_app.candidate_id,
      'match_score', v_app.match_score, 'created_at', v_app.created_at,
      'created', true, 'auto_rejected', false, 'unmet_requirements', '[]'::jsonb
    );
  end if;

  -- Recusa imediata pela regra da empresa. O candidato nunca ficou ativo: o
  -- prazo aberto pelo gatilho sai e nao conta na meta nem no selo.
  delete from public.feedback_deadlines fd where fd.application_id = v_app.id;

  update public.applications
  set current_stage = 'rejected', feedback_sent_at = now()
  where id = v_app.id
  returning * into v_app;

  v_content := format(
    'A vaga "%s" exige: %s. Pela sua resposta na candidatura, %s, por isso a candidatura não seguiu. Obrigado pelo interesse: outras vagas no Job Match podem combinar com o seu perfil.',
    v_job.title,
    array_to_string(v_unmet, '; '),
    case
      when cardinality(v_unmet) = 1 then 'esse requisito não foi atendido'
      else 'esses requisitos não foram atendidos'
    end
  );

  insert into public.feedbacks (
    application_id, author_id, content, kind, reason_code, sent_to_candidate_at
  ) values (
    v_app.id, v_job.recruiter_id, v_content, 'decision', 'eliminatory', now()
  );

  return jsonb_build_object(
    'id', v_app.id, 'job_id', v_app.job_id, 'candidate_id', v_app.candidate_id,
    'match_score', v_app.match_score, 'created_at', v_app.created_at,
    'created', true, 'auto_rejected', true, 'unmet_requirements', to_jsonb(v_unmet)
  );
end;
$$;

revoke all on function public.apply_to_job(uuid, jsonb) from public, anon;
grant execute on function public.apply_to_job(uuid, jsonb) to authenticated;