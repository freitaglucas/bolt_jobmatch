-- pgTAP: onboarding e privacidade da pretensão salarial (Sprint 1 · Etapa 2)
--
-- Roda no job `db-tests` via `supabase test db`. Mesma técnica do rls.test.sql:
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub": "<uuid>"}';
-- `reset role;` retorna ao superusuário para os fixtures ignorarem a RLS.

create extension if not exists pgtap with schema extensions;

begin;

select plan(6);

-- ---------------------------------------------------------------------
-- Fixtures: candidatos A/B e recrutador aprovado R1 (com vaga + candidatura)
-- ---------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'cand.a.onb@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Candidato A"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'cand.b.onb@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Candidato B"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'recr.r1.onb@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Recrutador R1"}', now(), now(), '', '', '', '');

update public.recruiter_profiles set approved_at = now()
  where user_id = 'c1000000-0000-0000-0000-000000000003';

insert into public.jobs (id, recruiter_id, title, employment_type, status)
values ('f1000000-0000-0000-0000-000000000001',
        'c1000000-0000-0000-0000-000000000003',
        'Vaga ativa do R1', 'CLT', 'active');

insert into public.applications (job_id, candidate_id)
values ('f1000000-0000-0000-0000-000000000001',
        'a1000000-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------------
-- A grava e lê a própria pretensão salarial
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-0000-0000-000000000001"}';

insert into public.candidate_private_preferences (user_id, salary_expectation)
values ('a1000000-0000-0000-0000-000000000001', 8000.00);

select ok(true, 'deve permitir: candidato A grava a propria pretensao salarial');

select is(
  (select count(*)::int from public.candidate_private_preferences
    where user_id = 'a1000000-0000-0000-0000-000000000001'),
  1,
  'deve permitir: candidato A le a propria pretensao salarial'
);

reset role;

-- ---------------------------------------------------------------------
-- B não lê a pretensão de A
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-0000-0000-000000000002"}';

select is(
  (select count(*)::int from public.candidate_private_preferences
    where user_id = 'a1000000-0000-0000-0000-000000000001'),
  0,
  'deve bloquear: candidato B nao le a pretensao salarial do candidato A'
);

reset role;

-- ---------------------------------------------------------------------
-- R1 (aprovado, com candidatura de A) NÃO lê o salário de A, mas continua
-- lendo as colunas antigas de candidate_profiles
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "c1000000-0000-0000-0000-000000000003"}';

select is(
  (select count(*)::int from public.candidate_private_preferences
    where user_id = 'a1000000-0000-0000-0000-000000000001'),
  0,
  'deve bloquear: recrutador aprovado nao le a pretensao salarial do candidato'
);

select is(
  (select count(*)::int from public.candidate_profiles
    where user_id = 'a1000000-0000-0000-0000-000000000001'),
  1,
  'deve permitir: recrutador aprovado continua lendo as colunas antigas de candidate_profiles'
);

reset role;

-- ---------------------------------------------------------------------
-- anon não lê a tabela privada
-- ---------------------------------------------------------------------

set local role anon;

select throws_ok(
  $$select 1 from public.candidate_private_preferences$$,
  '42501',
  NULL,
  'anon nao acessa candidate_private_preferences'
);

reset role;

select * from finish();

rollback;
