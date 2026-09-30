-- RLS regression tests (pgTAP)
--
-- Runs with: supabase test db  (see package.json script "test:db")
--
-- Everything happens inside a single transaction that is rolled back at the
-- end, so no fixture data is ever persisted.
--
-- Technique used to simulate a logged-in user (recommended by Supabase):
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub": "<user-uuid>"}';
-- `reset role;` returns to the superuser session so fixtures bypass RLS.

create extension if not exists pgtap with schema extensions;

begin;

select plan(56);

-- ---------------------------------------------------------------------
-- Fixtures: candidates, recruiters (2 approved, 1 not approved)
-- ---------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'candidate.a@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Candidata A"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'candidate.b@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Candidato B"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'recruiter.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Recrutador R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c2000000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'recruiter.r2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Recrutador R2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c3000000-0000-0000-0000-000000000005',
   'authenticated', 'authenticated', 'recruiter.r3@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Recrutador R3 (nao aprovado)"}', now(), now(), '', '', '', '');

-- Approve R1 and R2 only; R3 stays unapproved (approved_at is null).
update public.recruiter_profiles set approved_at = now()
  where user_id in ('c1000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000004');

-- Give both candidates a declared skill, used by the "vê so os proprios skills" tests.
insert into public.candidate_skills (candidate_id, skill_id, declared_level)
  select 'a0000000-0000-0000-0000-000000000001', id, 3 from public.skills where name = 'Git';
insert into public.candidate_skills (candidate_id, skill_id, declared_level)
  select 'b0000000-0000-0000-0000-000000000002', id, 3 from public.skills where name = 'Git';

-- Scratch table to carry ids of rows generated under RLS across role
-- switches. Temp tables are not subject to our RLS policies, so this is
-- only a test-harness detail -- it does not bypass any policy under test.
create temp table test_refs (key text primary key, id uuid not null);
grant select, insert on test_refs to authenticated, anon;

-- ---------------------------------------------------------------------
-- G) Vaga so pode ser criada por recrutador aprovado
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "c1000000-0000-0000-0000-000000000003"}';

-- Nota: um WITH que modifica dados (insert/update/delete) nao pode ficar
-- dentro de uma subquery passada como argumento de ok() -- o Postgres exige
-- que fique no nivel mais externo da instrucao. Por isso o insert roda como
-- instrucao top-level e o ok() so confirma que ele nao lancou erro de RLS.
insert into public.jobs (id, recruiter_id, title, employment_type, status)
values ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003',
        'Vaga ativa do R1', 'CLT', 'active');

select ok(true, 'deve permitir: recrutador aprovado (R1) cria vaga');

insert into public.jobs (id, recruiter_id, title, employment_type, status)
values ('f1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003',
        'Vaga rascunho do R1', 'CLT', 'draft');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-0000-0000-000000000004"}';

insert into public.jobs (id, recruiter_id, title, employment_type, status)
values ('f2000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000004',
        'Vaga ativa do R2', 'CLT', 'active');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c3000000-0000-0000-0000-000000000005"}';

select throws_ok(
  $$insert into public.jobs (id, recruiter_id, title, employment_type, status)
    values ('f3000000-0000-0000-0000-000000000009', 'c3000000-0000-0000-0000-000000000005',
            'Vaga do R3', 'CLT', 'active')$$,
  '42501',
  'deve bloquear: recrutador nao aprovado (R3) nao cria vaga'
);

reset role;

-- ---------------------------------------------------------------------
-- I) Candidato so se candidata a vaga ativa
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';

with ins as (
  insert into public.applications (job_id, candidate_id)
  values ('f1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001')
  returning id
) insert into test_refs (key, id) select 'app_a', id from ins;

select ok(true, 'deve permitir: candidato A se candidata a vaga ativa');

select throws_ok(
  $$insert into public.applications (job_id, candidate_id)
    values ('f1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001')$$,
  '42501',
  'deve bloquear: candidato A nao se candidata a vaga em rascunho (inativa)'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000002"}';

with ins as (
  insert into public.applications (job_id, candidate_id)
  values ('f2000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002')
  returning id
) insert into test_refs (key, id) select 'app_b', id from ins;

reset role;

-- ---------------------------------------------------------------------
-- J) Feedbacks: candidato le so os proprios; recrutador so das suas vagas
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "c1000000-0000-0000-0000-000000000003"}';

insert into public.feedbacks (id, application_id, author_id, content)
values ('fe000000-0000-0000-0000-000000000001',
        (select id from test_refs where key = 'app_a'),
        'c1000000-0000-0000-0000-000000000003', 'Bom fit tecnico, seguir para entrevista.');

select ok(true, 'deve permitir: R1 registra feedback na propria vaga');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-0000-0000-000000000004"}';

select throws_ok(
  $$insert into public.feedbacks (id, application_id, author_id, content)
    values ('f9000000-0000-0000-0000-000000000009',
            (select id from test_refs where key = 'app_a'),
            'c2000000-0000-0000-0000-000000000004', 'Tentativa indevida')$$,
  '42501',
  'deve bloquear: R2 nao registra feedback em candidatura de vaga do R1'
);

reset role;

-- ---------------------------------------------------------------------
-- L) event_log: usuario so insere/le os proprios eventos
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';

insert into public.event_log (id, user_id, session_id, event_type, target_type, target_id)
values ('ee000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
        gen_random_uuid(), 'swipe_decision', 'job', 'f1000000-0000-0000-0000-000000000001');

select ok(true, 'deve permitir: candidato A insere o proprio evento de telemetria');

select throws_ok(
  $$insert into public.event_log (id, user_id, session_id, event_type, target_type, target_id)
    values ('e9000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000002',
            gen_random_uuid(), 'swipe_decision', 'job', 'f1000000-0000-0000-0000-000000000001')$$,
  '42501',
  'deve bloquear: candidato A nao insere evento em nome do candidato B'
);

reset role;

-- R1 moves A's application forward on their own job (also feeds the audit_logs tests below).
set local role authenticated;
set local request.jwt.claims = '{"sub": "c1000000-0000-0000-0000-000000000003"}';

update public.applications set current_stage = 'screening'
  where id = (select id from test_refs where key = 'app_a');

reset role;

-- ---------------------------------------------------------------------
-- A) profiles: cada um le e edita so o proprio registro
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.profiles where id = 'a0000000-0000-0000-0000-000000000001'),
  1, 'deve permitir: candidato A le o proprio profile'
);
select is(
  (select count(*)::int from public.profiles where id = 'b0000000-0000-0000-0000-000000000002'),
  0, 'deve bloquear: candidato A nao le o profile do candidato B'
);
select is(
  (with upd as (
    update public.profiles set full_name = 'Candidata A Atualizada'
    where id = 'a0000000-0000-0000-0000-000000000001' returning 1
  ) select count(*)::int from upd),
  1, 'deve permitir: candidato A atualiza o proprio profile'
);
select is(
  (with upd as (
    update public.profiles set full_name = 'Hack'
    where id = 'b0000000-0000-0000-0000-000000000002' returning 1
  ) select count(*)::int from upd),
  0, 'deve bloquear: candidato A nao atualiza o profile do candidato B'
);

reset role;

-- ---------------------------------------------------------------------
-- B) candidate_profiles: cada um le e edita so o proprio registro
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.candidate_profiles where user_id = 'a0000000-0000-0000-0000-000000000001'),
  1, 'deve permitir: candidato A le o proprio candidate_profile'
);
select is(
  (select count(*)::int from public.candidate_profiles where user_id = 'b0000000-0000-0000-0000-000000000002'),
  0, 'deve bloquear: candidato A nao le o candidate_profile do candidato B'
);
select is(
  (with upd as (
    update public.candidate_profiles set bio = 'Atualizado por A'
    where user_id = 'a0000000-0000-0000-0000-000000000001' returning 1
  ) select count(*)::int from upd),
  1, 'deve permitir: candidato A atualiza o proprio candidate_profile'
);
select is(
  (with upd as (
    update public.candidate_profiles set bio = 'Hack'
    where user_id = 'b0000000-0000-0000-0000-000000000002' returning 1
  ) select count(*)::int from upd),
  0, 'deve bloquear: candidato A nao atualiza o candidate_profile do candidato B'
);

-- D) candidato A nao ve skills nem candidaturas do candidato B
select is(
  (select count(*)::int from public.candidate_skills where candidate_id = 'a0000000-0000-0000-0000-000000000001'),
  1, 'deve permitir: candidato A le as proprias skills'
);
select is(
  (select count(*)::int from public.candidate_skills where candidate_id = 'b0000000-0000-0000-0000-000000000002'),
  0, 'deve bloquear: candidato A nao le as skills do candidato B'
);
select is(
  (select count(*)::int from public.applications where candidate_id = 'a0000000-0000-0000-0000-000000000001'),
  1, 'deve permitir: candidato A le as proprias candidaturas'
);
select is(
  (select count(*)::int from public.applications where candidate_id = 'b0000000-0000-0000-0000-000000000002'),
  0, 'deve bloquear: candidato A nao le as candidaturas do candidato B'
);

reset role;

-- ---------------------------------------------------------------------
-- C) recruiter_profiles: cada um le e edita so o proprio registro
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "c1000000-0000-0000-0000-000000000003"}';

select is(
  (select count(*)::int from public.recruiter_profiles where user_id = 'c1000000-0000-0000-0000-000000000003'),
  1, 'deve permitir: R1 le o proprio recruiter_profile'
);
select is(
  (select count(*)::int from public.recruiter_profiles where user_id = 'c2000000-0000-0000-0000-000000000004'),
  0, 'deve bloquear: R1 nao le o recruiter_profile do R2'
);
select is(
  (with upd as (
    update public.recruiter_profiles set "position" = 'Head de Talent Acquisition'
    where user_id = 'c1000000-0000-0000-0000-000000000003' returning 1
  ) select count(*)::int from upd),
  1, 'deve permitir: R1 atualiza o proprio recruiter_profile'
);
select is(
  (with upd as (
    update public.recruiter_profiles set "position" = 'Hack'
    where user_id = 'c2000000-0000-0000-0000-000000000004' returning 1
  ) select count(*)::int from upd),
  0, 'deve bloquear: R1 nao atualiza o recruiter_profile do R2'
);

reset role;

-- ---------------------------------------------------------------------
-- E) R1 ve o perfil do candidato so se ele se candidatou a uma vaga do R1
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "c1000000-0000-0000-0000-000000000003"}';

select is(
  (select count(*)::int from public.candidate_profiles where user_id = 'a0000000-0000-0000-0000-000000000001'),
  1, 'deve permitir: R1 ve o candidate_profile de A (A se candidatou a vaga do R1)'
);
select is(
  (select count(*)::int from public.candidate_profiles where user_id = 'b0000000-0000-0000-0000-000000000002'),
  0, 'deve bloquear: R1 nao ve o candidate_profile de B (B nunca se candidatou a vaga do R1)'
);

-- ---------------------------------------------------------------------
-- F) R1 nao le nem move candidaturas de vagas do R2 (mas le/move as suas)
-- ---------------------------------------------------------------------

select is(
  (select count(*)::int from public.applications where job_id = 'f1000000-0000-0000-0000-000000000001'),
  1, 'deve permitir: R1 le candidaturas da propria vaga'
);
select is(
  (select count(*)::int from public.applications where job_id = 'f2000000-0000-0000-0000-000000000003'),
  0, 'deve bloquear: R1 nao le candidaturas de vaga do R2'
);
select is(
  (with upd as (
    update public.applications set current_stage = 'interview'
    where id = (select id from test_refs where key = 'app_a') returning 1
  ) select count(*)::int from upd),
  1, 'deve permitir: R1 move candidatura da propria vaga'
);
select is(
  (with upd as (
    update public.applications set current_stage = 'interview'
    where id = (select id from test_refs where key = 'app_b') returning 1
  ) select count(*)::int from upd),
  0, 'deve bloquear: R1 nao move candidatura de vaga do R2'
);

reset role;

-- ---------------------------------------------------------------------
-- H) Candidato so ve vagas com status active
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.jobs where id = 'f1000000-0000-0000-0000-000000000001'),
  1, 'deve permitir: candidato ve vaga com status active'
);
select is(
  (select count(*)::int from public.jobs where id = 'f1000000-0000-0000-0000-000000000002'),
  0, 'deve bloquear: candidato nao ve vaga em rascunho (draft)'
);

reset role;

-- ---------------------------------------------------------------------
-- J) Feedbacks: leitura (candidato le so os proprios; recrutador so das suas vagas)
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.feedbacks where application_id = (select id from test_refs where key = 'app_a')),
  1, 'deve permitir: candidato A le o proprio feedback'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000002"}';

select is(
  (select count(*)::int from public.feedbacks where application_id = (select id from test_refs where key = 'app_a')),
  0, 'deve bloquear: candidato B nao le feedback de candidatura do candidato A'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c1000000-0000-0000-0000-000000000003"}';

select is(
  (select count(*)::int from public.feedbacks where application_id = (select id from test_refs where key = 'app_a')),
  1, 'deve permitir: R1 le feedback da propria vaga'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-0000-0000-000000000004"}';

select is(
  (select count(*)::int from public.feedbacks where application_id = (select id from test_refs where key = 'app_a')),
  0, 'deve bloquear: R2 nao le feedback de candidatura de vaga do R1'
);

reset role;

-- ---------------------------------------------------------------------
-- K) audit_logs: recrutador le so as proprias acoes; candidato nao le nada
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "c1000000-0000-0000-0000-000000000003"}';

select ok(
  (select count(*)::int from public.audit_logs where actor_id = 'c1000000-0000-0000-0000-000000000003') > 0,
  'deve permitir: R1 le os proprios registros de audit_logs'
);
select is(
  (select count(*)::int from public.audit_logs where actor_id = 'c2000000-0000-0000-0000-000000000004'),
  0, 'deve bloquear: R1 nao le audit_logs de acoes do R2'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.audit_logs),
  0, 'deve bloquear: candidato nao le nenhum registro de audit_logs'
);

reset role;

-- ---------------------------------------------------------------------
-- L) event_log: leitura (usuario so le os proprios eventos)
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.event_log where id = 'ee000000-0000-0000-0000-000000000001'),
  1, 'deve permitir: candidato A le o proprio evento'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000002"}';

select is(
  (select count(*)::int from public.event_log where id = 'ee000000-0000-0000-0000-000000000001'),
  0, 'deve bloquear: candidato B nao le o evento do candidato A'
);

reset role;

-- ---------------------------------------------------------------------
-- M) anon: zero acesso a todas as tabelas
-- ---------------------------------------------------------------------

set local role anon;

select throws_ok($$select 1 from public.profiles$$, '42501', 'anon nao acessa profiles');
select throws_ok($$select 1 from public.user_roles$$, '42501', 'anon nao acessa user_roles');
select throws_ok($$select 1 from public.companies$$, '42501', 'anon nao acessa companies');
select throws_ok($$select 1 from public.candidate_profiles$$, '42501', 'anon nao acessa candidate_profiles');
select throws_ok($$select 1 from public.recruiter_profiles$$, '42501', 'anon nao acessa recruiter_profiles');
select throws_ok($$select 1 from public.skills$$, '42501', 'anon nao acessa skills');
select throws_ok($$select 1 from public.jobs$$, '42501', 'anon nao acessa jobs');
select throws_ok($$select 1 from public.job_skills$$, '42501', 'anon nao acessa job_skills');
select throws_ok($$select 1 from public.candidate_skills$$, '42501', 'anon nao acessa candidate_skills');
select throws_ok($$select 1 from public.applications$$, '42501', 'anon nao acessa applications');
select throws_ok($$select 1 from public.application_stages$$, '42501', 'anon nao acessa application_stages');
select throws_ok($$select 1 from public.feedbacks$$, '42501', 'anon nao acessa feedbacks');
select throws_ok($$select 1 from public.consents$$, '42501', 'anon nao acessa consents');
select throws_ok($$select 1 from public.event_log$$, '42501', 'anon nao acessa event_log');
select throws_ok($$select 1 from public.audit_logs$$, '42501', 'anon nao acessa audit_logs');

reset role;

select * from finish();

rollback;
