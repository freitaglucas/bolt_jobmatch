-- Testes pgTAP do selo publico de retorno no prazo (N65).
create extension if not exists pgtap with schema extensions;

begin;

select plan(14);

-- Fixtures: 5 recrutadores aprovados (R1..R5), 1 candidato.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  ('b' || n || '000000-0000-0000-0000-00000000000' || n)::uuid,
  'authenticated', 'authenticated', 'seal.r' || n || '@test.local', 'x',
  now(), '{"provider":"email","providers":["email"]}',
  ('{"role":"recruiter","full_name":"Seal R' || n || '"}')::jsonb,
  now(), now(), '', '', '', ''
from generate_series(1, 5) as n;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000', 'bc000000-0000-0000-0000-00000000000c',
  'authenticated', 'authenticated', 'seal.c1@test.local', 'x',
  now(), '{"provider":"email","providers":["email"]}',
  '{"role":"candidate","full_name":"Seal C1"}', now(), now(), '', '', '', ''
);

update public.recruiter_profiles set approved_at = now()
  where user_id in (
    'b1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002',
    'b3000000-0000-0000-0000-000000000003', 'b4000000-0000-0000-0000-000000000004',
    'b5000000-0000-0000-0000-000000000005'
  );

-- Vagas: J1 (R1), J1b (R1, sem candidaturas), J1d (R1, rascunho), J2..J5.
insert into public.jobs (id, recruiter_id, title, employment_type, status) values
  ('b9000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Selo J1', 'CLT', 'active'),
  ('b9000000-0000-0000-0000-00000000001b', 'b1000000-0000-0000-0000-000000000001', 'Selo J1b', 'CLT', 'active'),
  ('b9000000-0000-0000-0000-00000000001d', 'b1000000-0000-0000-0000-000000000001', 'Selo J1d', 'CLT', 'draft'),
  ('b9000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'Selo J2', 'CLT', 'active'),
  ('b9000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000003', 'Selo J3', 'CLT', 'active'),
  ('b9000000-0000-0000-0000-000000000004', 'b4000000-0000-0000-0000-000000000004', 'Selo J4', 'CLT', 'active'),
  ('b9000000-0000-0000-0000-000000000005', 'b5000000-0000-0000-0000-000000000005', 'Selo J5', 'CLT', 'active');

insert into public.applications (id, job_id, candidate_id) values
  ('be000000-0000-0000-0000-000000000001', 'b9000000-0000-0000-0000-000000000001', 'bc000000-0000-0000-0000-00000000000c'),
  ('be000000-0000-0000-0000-000000000002', 'b9000000-0000-0000-0000-000000000002', 'bc000000-0000-0000-0000-00000000000c'),
  ('be000000-0000-0000-0000-000000000003', 'b9000000-0000-0000-0000-000000000003', 'bc000000-0000-0000-0000-00000000000c'),
  ('be000000-0000-0000-0000-000000000004', 'b9000000-0000-0000-0000-000000000004', 'bc000000-0000-0000-0000-00000000000c'),
  ('be000000-0000-0000-0000-000000000005', 'b9000000-0000-0000-0000-000000000005', 'bc000000-0000-0000-0000-00000000000c');

-- Prazos controlados. No prazo: met_at <= due_at. Atrasado: met_at > due_at.
delete from public.feedback_deadlines;

-- J1: 30 prazos, 27 no prazo (90%) -> selo 90
insert into public.feedback_deadlines (application_id, stage, due_at, met_at)
select 'be000000-0000-0000-0000-000000000001', 'screening',
       now() - interval '10 days',
       case when g <= 27 then now() - interval '11 days' else now() - interval '9 days' end
from generate_series(1, 30) g;

-- J2: 29 prazos, todos no prazo (abaixo do minimo de 30) -> sem selo
insert into public.feedback_deadlines (application_id, stage, due_at, met_at)
select 'be000000-0000-0000-0000-000000000002', 'screening',
       now() - interval '10 days', now() - interval '11 days'
from generate_series(1, 29) g;

-- J3: 30 prazos, 26 no prazo (86%) -> sem selo
insert into public.feedback_deadlines (application_id, stage, due_at, met_at)
select 'be000000-0000-0000-0000-000000000003', 'screening',
       now() - interval '10 days',
       case when g <= 26 then now() - interval '11 days' else now() - interval '9 days' end
from generate_series(1, 30) g;

-- J4: 31 prazos, 29 no prazo (93,5%) -> selo 93 (arredonda para baixo)
insert into public.feedback_deadlines (application_id, stage, due_at, met_at)
select 'be000000-0000-0000-0000-000000000004', 'screening',
       now() - interval '10 days',
       case when g <= 29 then now() - interval '11 days' else now() - interval '9 days' end
from generate_series(1, 31) g;

-- J5: 30 prazos no prazo, mas ha 100 dias (fora da janela de 90) -> sem selo
insert into public.feedback_deadlines (application_id, stage, due_at, met_at)
select 'be000000-0000-0000-0000-000000000005', 'screening',
       now() - interval '100 days', now() - interval '101 days'
from generate_series(1, 30) g;

-- 1-2) Constantes
select is(public.return_seal_min_returns(), 30, 'minimo de 30 retornos com prazo');
select is(public.return_seal_window_days(), 90, 'janela de 90 dias');

-- 3-12) Chamada como visitante (anon)
set local role anon;

select is(
  (select seal_percent from public.public_return_seals(array['b9000000-0000-0000-0000-000000000001']::uuid[])),
  90, 'J1: 27 de 30 (90%) tem selo de 90%');

select is(
  (select seal_percent from public.public_return_seals(array['b9000000-0000-0000-0000-000000000004']::uuid[])),
  93, 'J4: 29 de 31 (93,5%) arredonda para baixo: 93%');

select is(
  (select count(*)::int from public.public_return_seals(array['b9000000-0000-0000-0000-000000000002']::uuid[])),
  0, 'J2: 29 retornos (abaixo do minimo) nao tem selo');

select is(
  (select count(*)::int from public.public_return_seals(array['b9000000-0000-0000-0000-000000000003']::uuid[])),
  0, 'J3: 86% (abaixo da meta) nao tem selo, e nao existe selo negativo');

select is(
  (select count(*)::int from public.public_return_seals(array['b9000000-0000-0000-0000-000000000005']::uuid[])),
  0, 'J5: prazos fora dos ultimos 90 dias nao contam');

select is(
  (select seal_percent from public.public_return_seals(array['b9000000-0000-0000-0000-00000000001b']::uuid[])),
  90, 'J1b: o indice e do recrutador, entao outra vaga ativa dele tem o mesmo selo');

select is(
  (select count(*)::int from public.public_return_seals(array['b9000000-0000-0000-0000-00000000001d']::uuid[])),
  0, 'vaga em rascunho nao tem selo publico');

select is(
  (select count(*)::int from public.public_return_seals(array[]::uuid[])),
  0, 'lista vazia nao devolve linhas');

select is(
  (select count(*)::int from public.public_return_seals(array['00000000-0000-0000-0000-0000000000ff']::uuid[])),
  0, 'vaga inexistente nao devolve linha');

select is(
  (select count(*)::int from public.public_return_seals(array[
    'b9000000-0000-0000-0000-000000000001', 'b9000000-0000-0000-0000-000000000002',
    'b9000000-0000-0000-0000-000000000003', 'b9000000-0000-0000-0000-000000000004',
    'b9000000-0000-0000-0000-000000000005', 'b9000000-0000-0000-0000-00000000001b'
  ]::uuid[])),
  3, 'varias vagas de uma vez: so J1, J1b e J4 tem selo');

-- 13) So devolve o job_id e o percentual (nada de contagens)
reset role;
select is(
  (select pg_get_function_result(p.oid) from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'public_return_seals'),
  'TABLE(job_id uuid, seal_percent integer)',
  'a funcao devolve so job_id e seal_percent');

-- 14) As constantes internas nao ficam abertas ao publico
set local role anon;
select throws_ok(
  $$select public.return_seal_min_returns()$$,
  '42501', NULL, 'anon nao executa as constantes internas');

select * from finish();
rollback;
