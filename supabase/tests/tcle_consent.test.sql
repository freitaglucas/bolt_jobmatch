-- pgTAP: consentimento LGPD/TCLE criado pelo handle_new_user no cadastro
--
-- Roda dentro do job `db-tests` do CI via `supabase test db`. A conexão é
-- superusuária (postgres), então os INSERTs em auth.users disparam o trigger
-- handle_new_user normalmente, e as leituras em public.consents ignoram a RLS
-- (mesmo padrão já usado em seeds.test.sql).

create extension if not exists pgtap with schema extensions;

begin;

select plan(3);

-- 1) cadastro com role e tcle_version cria o consentimento 'tcle'
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'd1000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'tcle.accepted@test.local', 'x',
  now(), '{"provider":"email","providers":["email"]}',
  '{"role":"candidate","full_name":"TCLE Aceito","tcle_version":"v1"}',
  now(), now(), '', '', '', ''
);

select is(
  (select count(*)::int from public.consents
    where user_id = 'd1000000-0000-0000-0000-000000000001'
      and consent_type = 'tcle'
      and policy_version = 'v1'),
  1,
  'cadastro com tcle_version cria consentimento tcle com a versao recebida'
);

-- 2) cadastro com role mas sem tcle_version nao cria consentimento
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'd2000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated', 'tcle.legacy@test.local', 'x',
  now(), '{"provider":"email","providers":["email"]}',
  '{"role":"candidate","full_name":"Conta Legada"}',
  now(), now(), '', '', '', ''
);

select is(
  (select count(*)::int from public.consents
    where user_id = 'd2000000-0000-0000-0000-000000000002'),
  0,
  'cadastro sem tcle_version nao cria consentimento'
);

-- 3) cadastro sem role continua falhando (raise exception do trigger)
select throws_ok(
  $$insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    'd3000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated', 'no.role@test.local', 'x',
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sem Role","tcle_version":"v1"}',
    now(), now(), '', '', '', ''
  )$$,
  'P0001',
  NULL,
  'cadastro sem role continua falhando'
);

select * from finish();

rollback;
