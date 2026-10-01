-- pgTAP: onboarding do recrutador (empresa + campos próprios do perfil)
--
-- Roda dentro do job `db-tests` do CI via `supabase test db`. Mesma técnica do
-- rls.test.sql:
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub": "<uuid>"}';
-- `reset role;` retorna ao superusuário para os fixtures ignorarem a RLS.
--
-- Cobre:
--   1. o recrutador cria a própria empresa (created_by = auth.uid());
--   2. o recrutador atualiza position/phone/company_id da própria linha;
--   3. o recrutador NÃO consegue alterar o próprio approved_at (a coluna não
--      está no grant update de recruiter_profiles).

create extension if not exists pgtap with schema extensions;

begin;

select plan(3);

-- ---------------------------------------------------------------------
-- Fixture: recrutador não aprovado (handle_new_user cria profiles,
-- user_roles e recruiter_profiles automaticamente)
-- ---------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'e1000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'recr.onb@test.local', 'x',
  now(), '{"provider":"email","providers":["email"]}',
  '{"role":"recruiter","full_name":"Recrutador Onboarding"}',
  now(), now(), '', '', '', ''
);

-- ---------------------------------------------------------------------
-- 1) recrutador cria a própria empresa
-- ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "e1000000-0000-0000-0000-000000000001"}';

insert into public.companies (created_by, name)
values ('e1000000-0000-0000-0000-000000000001', 'Empresa do Recrutador');

select is(
  (select count(*)::int from public.companies
    where created_by = 'e1000000-0000-0000-0000-000000000001'
      and name = 'Empresa do Recrutador'),
  1,
  'deve permitir: recrutador cria a propria empresa'
);

select id as company_id from public.companies
where created_by = 'e1000000-0000-0000-0000-000000000001'
  and name = 'Empresa do Recrutador' \gset

-- ---------------------------------------------------------------------
-- 2) recrutador atualiza position/phone/company_id da própria linha
-- ---------------------------------------------------------------------

update public.recruiter_profiles
set company_id = :'company_id',
    position = 'Tech Recruiter',
    phone = '11987654321'
where user_id = 'e1000000-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from public.recruiter_profiles
    where user_id = 'e1000000-0000-0000-0000-000000000001'
      and company_id = :'company_id'
      and position = 'Tech Recruiter'
      and phone = '11987654321'),
  1,
  'deve permitir: recrutador atualiza position/phone/company_id da propria linha'
);

-- ---------------------------------------------------------------------
-- 3) recrutador não consegue alterar o próprio approved_at
-- ---------------------------------------------------------------------

select throws_ok(
  $$update public.recruiter_profiles set approved_at = now()
    where user_id = 'e1000000-0000-0000-0000-000000000001'$$,
  '42501',
  NULL,
  'deve bloquear: recrutador nao altera o proprio approved_at'
);

reset role;

select * from finish();

rollback;
