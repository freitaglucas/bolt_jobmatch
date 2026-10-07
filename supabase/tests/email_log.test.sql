-- Testes pgTAP do registro de e-mails (N17).
create extension if not exists pgtap with schema extensions;

begin;

select plan(7);

-- Fixtures: dois recrutadores e um candidato.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'mail.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Mail R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'f2000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'mail.r2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Mail R2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'f3000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'mail.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Mail C1"}', now(), now(), '', '', '', '');

-- Linhas gravadas como superusuario (e o que a edge function faz com a chave de servico).
insert into public.email_log (recruiter_id, template, to_email, status, provider_id)
values
  ('f1000000-0000-0000-0000-000000000001', 'test', 'mail.r1@test.local', 'sent', 'prov-1'),
  ('f1000000-0000-0000-0000-000000000001', 'test', 'mail.r1@test.local', 'failed', null),
  ('f2000000-0000-0000-0000-000000000002', 'test', 'mail.r2@test.local', 'sent', 'prov-2');

-- 1) Status invalido e recusado
select throws_ok(
  $$insert into public.email_log (recruiter_id, template, to_email, status)
    values ('f1000000-0000-0000-0000-000000000001', 'test', 'a@b.c', 'pending')$$,
  '23514', NULL, 'status fora de sent/failed e recusado');

-- 2-3) R1 ve so as proprias linhas
set local role authenticated;
set local request.jwt.claims = '{"sub": "f1000000-0000-0000-0000-000000000001"}';

select is((select count(*)::int from public.email_log), 2, 'R1 ve as 2 linhas dele');
select is(
  (select count(*)::int from public.email_log where recruiter_id = 'f2000000-0000-0000-0000-000000000002'),
  0, 'R1 nao ve a linha do R2');

-- 4-5) Recrutador nao escreve no log
select throws_ok(
  $$insert into public.email_log (recruiter_id, template, to_email, status)
    values ('f1000000-0000-0000-0000-000000000001', 'test', 'a@b.c', 'sent')$$,
  '42501', NULL, 'recrutador nao insere no log de e-mails');
select throws_ok(
  $$delete from public.email_log$$,
  '42501', NULL, 'recrutador nao apaga do log de e-mails');

-- 6) R2 ve so a dele
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "f2000000-0000-0000-0000-000000000002"}';
select is((select count(*)::int from public.email_log), 1, 'R2 ve apenas a linha dele');

-- 7) Candidato nao ve nada
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "f3000000-0000-0000-0000-000000000003"}';
select is((select count(*)::int from public.email_log), 0, 'candidato nao ve o log de e-mails');

select * from finish();
rollback;
