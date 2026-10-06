-- Testes pgTAP do ledger de tokens (Fase 3a; N14: mover etapa e gratis).
create extension if not exists pgtap with schema extensions;

begin;

select plan(22);

-- Fixtures: R1/R2 aprovados, R3 nao aprovado, 4 candidatos, 1 vaga do R1, 4 candidaturas.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'tok.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Tok R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd2000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'tok.r2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Tok R2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd3000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'tok.r3@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Tok R3 nao aprovado"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd4000000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'tok.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Tok C1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd5000000-0000-0000-0000-000000000005',
   'authenticated', 'authenticated', 'tok.c2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Tok C2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd6000000-0000-0000-0000-000000000006',
   'authenticated', 'authenticated', 'tok.c3@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Tok C3"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd7000000-0000-0000-0000-000000000007',
   'authenticated', 'authenticated', 'tok.c4@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Tok C4"}', now(), now(), '', '', '', '');

update public.recruiter_profiles set approved_at = now()
  where user_id in ('d1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000002');

insert into public.jobs (id, recruiter_id, title, employment_type, status)
values ('d9000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000001',
        'Vaga tokens R1', 'CLT', 'active');

insert into public.applications (id, job_id, candidate_id) values
  ('e1000000-0000-0000-0000-000000000001', 'd9000000-0000-0000-0000-000000000009', 'd4000000-0000-0000-0000-000000000004'),
  ('e2000000-0000-0000-0000-000000000002', 'd9000000-0000-0000-0000-000000000009', 'd5000000-0000-0000-0000-000000000005'),
  ('e3000000-0000-0000-0000-000000000003', 'd9000000-0000-0000-0000-000000000009', 'd6000000-0000-0000-0000-000000000006'),
  ('e4000000-0000-0000-0000-000000000004', 'd9000000-0000-0000-0000-000000000009', 'd7000000-0000-0000-0000-000000000007');

-- 1-3) Tokens iniciais
select is(
  (select sum(amount)::int from public.token_ledger where recruiter_id = 'd1000000-0000-0000-0000-000000000001'),
  20, 'R1 aprovado recebe 20 tokens iniciais');

update public.recruiter_profiles set approved_at = now() + interval '1 second'
  where user_id = 'd1000000-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.token_ledger
    where recruiter_id = 'd1000000-0000-0000-0000-000000000001' and kind = 'initial_grant'),
  1, 'aprovar de novo nao duplica o credito inicial');

select is(
  (select count(*)::int from public.token_ledger where recruiter_id = 'd3000000-0000-0000-0000-000000000003'),
  0, 'recrutador nao aprovado nao recebe tokens');

-- 4) Saldo como R1
set local role authenticated;
set local request.jwt.claims = '{"sub": "d1000000-0000-0000-0000-000000000001"}';

select is((select public.my_token_balance()), 20, 'my_token_balance() = 20 para R1');

-- 5) Mover etapa e gratis
update public.applications set current_stage = 'screening'
  where id = 'e1000000-0000-0000-0000-000000000001';
select is((select public.my_token_balance()), 20, 'mover etapa nao consome token');

-- 6) Rejeitar e gratis
update public.applications set current_stage = 'rejected'
  where id = 'e2000000-0000-0000-0000-000000000002';
select is((select public.my_token_balance()), 20, 'rejeitar nao consome token');

-- 7) Recrutador nao altera last_stage_change_at
select throws_ok(
  $$update public.applications set last_stage_change_at = now()
    where id = 'e1000000-0000-0000-0000-000000000001'$$,
  '42501', NULL, 'recrutador nao pode alterar last_stage_change_at');

-- 8) Feedback no prazo credita
insert into public.feedbacks (application_id, author_id, content, sent_to_candidate_at)
values ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
        'Feedback no prazo', now());
select is((select public.my_token_balance()), 21, 'feedback no prazo credita 1 token');

-- 9) Segundo feedback na mesma etapa nao credita
insert into public.feedbacks (application_id, author_id, content, sent_to_candidate_at)
values ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
        'Segundo feedback mesma etapa', now());
select is((select public.my_token_balance()), 21, 'segundo feedback na mesma etapa nao credita');

-- 10) Rascunho nao credita
insert into public.feedbacks (application_id, author_id, content)
values ('e3000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001',
        'Rascunho');
select is((select public.my_token_balance()), 21, 'feedback sem envio (rascunho) nao credita');

-- 11) Feedback atrasado nao credita
reset role;
update public.applications set last_stage_change_at = now() - interval '6 days'
  where id = 'e4000000-0000-0000-0000-000000000004';
set local role authenticated;
set local request.jwt.claims = '{"sub": "d1000000-0000-0000-0000-000000000001"}';
insert into public.feedbacks (application_id, author_id, content, sent_to_candidate_at)
values ('e4000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001',
        'Feedback atrasado', now());
select is((select public.my_token_balance()), 21, 'feedback fora do SLA nao credita');

-- 12-14) Ledger e somente leitura para o recrutador
select throws_ok(
  $$insert into public.token_ledger (recruiter_id, amount, kind)
    values ('d1000000-0000-0000-0000-000000000001', 5, 'initial_grant')$$,
  '42501', NULL, 'recrutador nao insere no ledger');
select throws_ok(
  $$update public.token_ledger set amount = 99$$,
  '42501', NULL, 'recrutador nao atualiza o ledger');
select throws_ok(
  $$delete from public.token_ledger$$,
  '42501', NULL, 'recrutador nao apaga do ledger');

-- 15) Zera o saldo (como superusuario; linha 'stage_move_debit' = historico da regra antiga)
reset role;
insert into public.token_ledger (recruiter_id, amount, kind)
values ('d1000000-0000-0000-0000-000000000001', -21, 'stage_move_debit');
select is(
  (select sum(amount)::int from public.token_ledger where recruiter_id = 'd1000000-0000-0000-0000-000000000001'),
  0, 'saldo do R1 zerado');

-- 16-18) Saldo zero nunca trava o trabalho manual
set local role authenticated;
set local request.jwt.claims = '{"sub": "d1000000-0000-0000-0000-000000000001"}';

select lives_ok(
  $$update public.applications set current_stage = 'screening'
    where id = 'e3000000-0000-0000-0000-000000000003'$$,
  'mover etapa com saldo zero continua permitido');

select is(
  (select current_stage::text from public.applications where id = 'e3000000-0000-0000-0000-000000000003'),
  'screening', 'etapa mudou mesmo com saldo zero');

select lives_ok(
  $$update public.applications set current_stage = 'rejected'
    where id = 'e3000000-0000-0000-0000-000000000003'$$,
  'rejeitar continua permitido com saldo zero');

-- 19-20) Isolamento entre recrutadores
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "d2000000-0000-0000-0000-000000000002"}';

select is(
  (select count(*)::int from public.token_ledger where recruiter_id = 'd1000000-0000-0000-0000-000000000001'),
  0, 'R2 nao ve o extrato do R1');
select is((select public.my_token_balance()), 20, 'R2 tem saldo proprio de 20');

-- 21) Candidato nao ve ledger
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "d4000000-0000-0000-0000-000000000004"}';

select is(
  (select count(*)::int from public.token_ledger),
  0, 'candidato nao ve linhas do ledger');

-- 22) O gatilho de debito foi removido
select hasnt_trigger('public', 'applications', 'applications_charge_tokens',
  'gatilho de debito ao mover etapa nao existe mais');

select * from finish();
rollback;
