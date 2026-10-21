-- Testes pgTAP dos eventos do funil do candidato (N84).
create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'f8400000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'funnel.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Funnel C1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'f8400000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'funnel.c2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Funnel C2"}', now(), now(), '', '', '', '');

set local role authenticated;
set local request.jwt.claims = '{"sub": "f8400000-0000-0000-0000-000000000001"}';

select lives_ok(
  $$insert into public.event_log (user_id, session_id, event_type, target_type, target_id, metadata)
    values ('f8400000-0000-0000-0000-000000000001', gen_random_uuid(), 'profile_started',
            'candidate', 'f8400000-0000-0000-0000-000000000001',
            '{"source":"job_link","source_job_id":"f8400000-0000-0000-0000-0000000000aa"}')$$,
  'deve permitir: candidato registra "comecou o perfil"'
);

select throws_ok(
  $$insert into public.event_log (user_id, session_id, event_type, target_type, target_id)
    values ('f8400000-0000-0000-0000-000000000001', gen_random_uuid(), 'profile_started',
            'candidate', 'f8400000-0000-0000-0000-000000000001')$$,
  '23505', NULL,
  'deve bloquear: "comecou o perfil" conta uma vez por pessoa'
);

select lives_ok(
  $$insert into public.event_log (user_id, session_id, event_type, target_type, target_id)
    values ('f8400000-0000-0000-0000-000000000001', gen_random_uuid(), 'profile_completed',
            'candidate', 'f8400000-0000-0000-0000-000000000001')$$,
  'deve permitir: candidato registra "completou o perfil"'
);

select throws_ok(
  $$insert into public.event_log (user_id, session_id, event_type, target_type, target_id)
    values ('f8400000-0000-0000-0000-000000000001', gen_random_uuid(), 'profile_completed',
            'candidate', 'f8400000-0000-0000-0000-000000000001')$$,
  '23505', NULL,
  'deve bloquear: "completou o perfil" conta uma vez por pessoa'
);

select lives_ok(
  $$insert into public.event_log (user_id, session_id, event_type, target_type, target_id, metadata)
    values ('f8400000-0000-0000-0000-000000000001', gen_random_uuid(), 'job_viewed', 'job',
            'f8400000-0000-0000-0000-0000000000aa', '{"source":"job_link"}'),
           ('f8400000-0000-0000-0000-000000000001', gen_random_uuid(), 'job_viewed', 'job',
            'f8400000-0000-0000-0000-0000000000aa', '{"source":"detail"}')$$,
  'deve permitir: "abriu a vaga" pode repetir'
);

select throws_ok(
  $$insert into public.event_log (user_id, session_id, event_type, target_type, target_id)
    values ('f8400000-0000-0000-0000-000000000001', gen_random_uuid(), 'page_hack',
            'job', 'f8400000-0000-0000-0000-0000000000aa')$$,
  '23514', NULL,
  'deve bloquear: tipo de evento fora da lista'
);

select throws_ok(
  $$insert into public.event_log (user_id, session_id, event_type, target_type, target_id)
    values ('f8400000-0000-0000-0000-000000000002', gen_random_uuid(), 'profile_started',
            'candidate', 'f8400000-0000-0000-0000-000000000002')$$,
  '42501', NULL,
  'deve bloquear: candidato nao registra evento em nome de outra pessoa'
);

reset role;
set local role anon;

select throws_ok(
  $$insert into public.event_log (user_id, session_id, event_type, target_type, target_id)
    values ('f8400000-0000-0000-0000-000000000001', gen_random_uuid(), 'job_viewed',
            'job', 'f8400000-0000-0000-0000-0000000000aa')$$,
  '42501', NULL,
  'deve bloquear: anonimo nao grava evento'
);

reset role;

select * from finish();

rollback;
