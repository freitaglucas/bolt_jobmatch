-- Testes pgTAP do ledger de tokens. NOVO-7: o token nao paga nada; a aprovacao
-- nao da mais tokens, o saldo saiu do banco e o extrato fica so como historico.
create extension if not exists pgtap with schema extensions;

begin;

select plan(19);

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

-- 1-5) Estrutura: sem gatilho de credito inicial, sem saldo; ledger e prazo ficam
select hasnt_trigger('public', 'recruiter_profiles', 'recruiter_profiles_grant_tokens',
  'gatilho de tokens iniciais nao existe mais');
select hasnt_function('public', 'grant_initial_tokens',
  'funcao de tokens iniciais nao existe mais');
select hasnt_function('public', 'my_token_balance',
  'saldo de tokens nao existe mais');
select has_table('public', 'token_ledger', 'token_ledger fica como historico');
select has_function('public', 'feedback_sla', 'feedback_sla continua (base do prazo)');

-- 6) Aprovar recrutador nao grava nada no ledger
select is(
  (select count(*)::int from public.token_ledger
    where recruiter_id in ('d1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000002')),
  0, 'recrutador aprovado nao recebe tokens');

-- Linha antiga do extrato (como superusuario), para testar a leitura do historico
insert into public.token_ledger (recruiter_id, amount, kind)
values ('d1000000-0000-0000-0000-000000000001', 20, 'initial_grant');

-- 7) R1 le o proprio historico
set local role authenticated;
set local request.jwt.claims = '{"sub": "d1000000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.token_ledger),
  1, 'R1 le a propria linha historica');

-- 8-10) Mover etapa e rejeitar sao gratis
select lives_ok(
  $$update public.applications set current_stage = 'screening'
    where id = 'e1000000-0000-0000-0000-000000000001'$$,
  'mover etapa continua permitido');
select is(
  (select current_stage::text from public.applications where id = 'e1000000-0000-0000-0000-000000000001'),
  'screening', 'etapa mudou');
select lives_ok(
  $$update public.applications set current_stage = 'rejected'
    where id = 'e2000000-0000-0000-0000-000000000002'$$,
  'rejeitar continua permitido');

-- 11) Recrutador nao altera last_stage_change_at
select throws_ok(
  $$update public.applications set last_stage_change_at = now()
    where id = 'e1000000-0000-0000-0000-000000000001'$$,
  '42501', NULL, 'recrutador nao pode alterar last_stage_change_at');

-- 12) Retorno no prazo nao grava nada no ledger
insert into public.feedbacks (application_id, author_id, content, sent_to_candidate_at)
values ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
        'Retorno no prazo', now());
select is(
  (select count(*)::int from public.token_ledger),
  1, 'retorno no prazo nao grava no ledger');

-- 13-15) Ledger e somente leitura para o recrutador
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

-- 16) Isolamento entre recrutadores
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "d2000000-0000-0000-0000-000000000002"}';

select is(
  (select count(*)::int from public.token_ledger),
  0, 'R2 nao ve o historico do R1');

-- 17) Candidato nao ve ledger
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "d4000000-0000-0000-0000-000000000004"}';

select is(
  (select count(*)::int from public.token_ledger),
  0, 'candidato nao ve linhas do ledger');

-- 18-19) Gatilhos antigos continuam removidos
reset role;
select hasnt_trigger('public', 'applications', 'applications_charge_tokens',
  'gatilho de debito ao mover etapa nao existe mais');
select hasnt_trigger('public', 'feedbacks', 'feedbacks_credit_tokens',
  'gatilho de credito por feedback nao existe mais');

select * from finish();
rollback;


