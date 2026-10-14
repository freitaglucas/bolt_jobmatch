-- Testes pgTAP da regra de encerrar vaga (N64): so fecha sem candidatos pendentes.
create extension if not exists pgtap with schema extensions;

begin;

select plan(7);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'fecha.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Fecha R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd3000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'fecha.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Fecha C1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd4000000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'fecha.c2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Fecha C2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd5000000-0000-0000-0000-000000000005',
   'authenticated', 'authenticated', 'fecha.c3@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Fecha C3"}', now(), now(), '', '', '', '');

update public.recruiter_profiles set approved_at = now()
  where user_id = 'd1000000-0000-0000-0000-000000000001';

insert into public.jobs (id, recruiter_id, title, employment_type, status) values
  ('d9000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'Vaga com pendente', 'CLT', 'active'),
  ('d9000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001',
   'Vaga so com encerrados', 'CLT', 'active');

-- Vaga 1: uma candidatura pendente (Em analise)
insert into public.applications (id, job_id, candidate_id) values
  ('da000000-0000-0000-0000-000000000001', 'd9000000-0000-0000-0000-000000000001',
   'd3000000-0000-0000-0000-000000000003');

-- Vaga 2: aprovada, rejeitada e desistida (nenhuma pendente)
insert into public.applications (id, job_id, candidate_id, current_stage) values
  ('da000000-0000-0000-0000-000000000002', 'd9000000-0000-0000-0000-000000000002',
   'd3000000-0000-0000-0000-000000000003', 'approved'),
  ('da000000-0000-0000-0000-000000000003', 'd9000000-0000-0000-0000-000000000002',
   'd4000000-0000-0000-0000-000000000004', 'rejected'),
  ('da000000-0000-0000-0000-000000000004', 'd9000000-0000-0000-0000-000000000002',
   'd5000000-0000-0000-0000-000000000005', 'withdrawn');

-- 1) Pendente impede o encerramento
select throws_ok(
  $$update public.jobs set status = 'closed' where id = 'd9000000-0000-0000-0000-000000000001'$$,
  'P0001', 'job_has_pending_candidates', 'vaga com candidato pendente nao fecha');

-- 2) Pausar e reativar com pendente continua permitido
select lives_ok(
  $$update public.jobs set status = 'paused' where id = 'd9000000-0000-0000-0000-000000000001'$$,
  'pausar vaga com pendente e permitido');

-- 3) A regra vale tambem pela API do recrutador (RLS)
set local role authenticated;
set local request.jwt.claims = '{"sub": "d1000000-0000-0000-0000-000000000001"}';
select throws_ok(
  $$update public.jobs set status = 'closed' where id = 'd9000000-0000-0000-0000-000000000001'$$,
  'P0001', 'job_has_pending_candidates', 'recrutador tambem nao fecha vaga com pendente');
reset role;

-- 4) Rejeitada a ultima pendente, a vaga fecha
update public.applications set current_stage = 'rejected'
  where id = 'da000000-0000-0000-0000-000000000001';
select lives_ok(
  $$update public.jobs set status = 'closed' where id = 'd9000000-0000-0000-0000-000000000001'$$,
  'sem pendentes, a vaga fecha');

-- 5) Aprovados, rejeitados e desistentes nao seguram a vaga
select lives_ok(
  $$update public.jobs set status = 'closed' where id = 'd9000000-0000-0000-0000-000000000002'$$,
  'vaga so com aprovado, rejeitado e desistente fecha');

-- 6) Vaga ja fechada: editar outros campos nao reaplica a regra
insert into public.applications (id, job_id, candidate_id)
values ('da000000-0000-0000-0000-000000000005', 'd9000000-0000-0000-0000-000000000001',
        'd4000000-0000-0000-0000-000000000004');
select lives_ok(
  $$update public.jobs set title = 'Vaga encerrada' where id = 'd9000000-0000-0000-0000-000000000001'$$,
  'mudar o titulo de vaga fechada, mesmo com candidatura nova, nao e bloqueado');

-- 7) A funcao da regra nao e chamavel pelo recrutador
set local role authenticated;
set local request.jwt.claims = '{"sub": "d1000000-0000-0000-0000-000000000001"}';
select throws_ok(
  $$select public.enforce_job_close_rule()$$,
  '42501', NULL, 'funcao da regra nao e executavel por authenticated');

select * from finish();
rollback;

