-- pgTAP: os limites por coluna valem de verdade para authenticated.
-- Roda no job db-tests do CI via `supabase test db`.

create extension if not exists pgtap with schema extensions;

begin;

select plan(3);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'cand.grants@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Candidata Grants"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'recr.grants@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Recrutador Grants"}', now(), now(), '', '', '', '');

-- Candidata
set local role authenticated;
set local request.jwt.claims = '{"sub": "f1000000-0000-0000-0000-000000000001"}';

select throws_ok(
  $$insert into public.applications (job_id, candidate_id, status)
    values ('5eed0000-0000-4000-8001-000000000001', 'f1000000-0000-0000-0000-000000000001', 'approved')$$,
  '42501',
  NULL,
  'deve bloquear: candidata nao escolhe o status ao se candidatar'
);

reset role;

-- Recrutador
set local role authenticated;
set local request.jwt.claims = '{"sub": "f1000000-0000-0000-0000-000000000002"}';

select throws_ok(
  $$update public.recruiter_profiles set approved_at = now()
    where user_id = 'f1000000-0000-0000-0000-000000000002'$$,
  '42501',
  NULL,
  'deve bloquear: recrutador nao se autoaprova'
);

select throws_ok(
  $$update public.applications set match_score = 100 where false$$,
  '42501',
  NULL,
  'deve bloquear: recrutador nao altera match_score'
);

reset role;

select * from finish();

rollback;