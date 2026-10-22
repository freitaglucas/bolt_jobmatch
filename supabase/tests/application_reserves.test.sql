-- Testes pgTAP da reserva interna de finalistas (N83a).
create extension if not exists pgtap with schema extensions;

begin;

select plan(22);

-- Fixtures: R1 (dono da vaga) e R2 aprovados; C1 na Final, C2 na Entrevista.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'e8300000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'rsv.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Rsv R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e8300000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'rsv.r2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Rsv R2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e8300000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'rsv.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Rsv C1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e8300000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'rsv.c2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Rsv C2"}', now(), now(), '', '', '', '');

update public.recruiter_profiles set approved_at = now()
  where user_id in ('e8300000-0000-0000-0000-000000000001', 'e8300000-0000-0000-0000-000000000002');

insert into public.jobs (id, recruiter_id, title, employment_type, status)
values ('e8300000-0000-0000-0000-0000000000a1', 'e8300000-0000-0000-0000-000000000001',
        'Vaga reserva R1', 'CLT', 'active');

insert into public.applications (id, job_id, candidate_id) values
  ('e8300000-0000-0000-0000-0000000000c1', 'e8300000-0000-0000-0000-0000000000a1', 'e8300000-0000-0000-0000-000000000003'),
  ('e8300000-0000-0000-0000-0000000000c2', 'e8300000-0000-0000-0000-0000000000a1', 'e8300000-0000-0000-0000-000000000004');

update public.applications set current_stage = 'final_interview'
  where id = 'e8300000-0000-0000-0000-0000000000c1';
update public.applications set current_stage = 'interview'
  where id = 'e8300000-0000-0000-0000-0000000000c2';

-- 1-3) Tabela e constantes
select has_table('public', 'application_reserves', 'tabela application_reserves existe');
select is((select public.reserve_days()), 14, 'reserva vale 14 dias');
select is((select public.max_reserve_renewals()), 1, 'reserva aceita 1 renovacao');

-- Como R1 (dono da vaga)
set local role authenticated;
set local request.jwt.claims = '{"sub": "e8300000-0000-0000-0000-000000000001"}';

-- 4-5) So a etapa Final entra em reserva, com mensagem de 10 a 1000 caracteres
select throws_ok(
  $$select public.put_on_reserve('e8300000-0000-0000-0000-0000000000c2',
    'Voce esta na fase final do processo seletivo.')$$,
  'P0001', 'stage_not_final', 'deve bloquear: candidato fora da etapa Final');
select throws_ok(
  $$select public.put_on_reserve('e8300000-0000-0000-0000-0000000000c1', 'curta')$$,
  '22023', 'invalid_message', 'deve bloquear: mensagem curta demais');

-- 6-11) Colocar em reserva
select lives_ok(
  $$select public.put_on_reserve('e8300000-0000-0000-0000-0000000000c1',
    'Voce esta na fase final do processo seletivo da vaga. O proximo retorno sai ate 05/11.')$$,
  'deve permitir: dono da vaga coloca finalista em reserva');
select is(
  (select count(*)::int from public.application_reserves
    where application_id = 'e8300000-0000-0000-0000-0000000000c1' and ended_at is null),
  1, 'reserva ativa registrada');
select is(
  (select (valid_until - reserved_at) from public.application_reserves
    where application_id = 'e8300000-0000-0000-0000-0000000000c1'),
  interval '14 days', 'validade de 14 dias');
select is(
  (select d.due_at from public.feedback_deadlines d
    where d.application_id = 'e8300000-0000-0000-0000-0000000000c1' and d.met_at is null),
  (select r.valid_until from public.application_reserves r
    where r.application_id = 'e8300000-0000-0000-0000-0000000000c1'),
  'o prazo aberto vai ate a validade da reserva');
select is(
  (select count(*)::int from public.feedback_deadlines d
    where d.application_id = 'e8300000-0000-0000-0000-0000000000c1'
      and d.stage = 'final_interview' and d.met_at is not null and d.met_at <= d.due_at),
  1, 'o aviso cumpre no prazo o prazo da etapa Final (nao conta como atraso)');
select is(
  (select kind from public.feedbacks
    where application_id = 'e8300000-0000-0000-0000-0000000000c1'
    order by created_at desc limit 1),
  'update', 'o candidato recebe uma atualizacao comum (nunca "reserva")');

select throws_ok(
  $$select public.put_on_reserve('e8300000-0000-0000-0000-0000000000c1',
    'Voce esta na fase final do processo seletivo.')$$,
  'P0001', 'already_reserved', 'deve bloquear: duas reservas ativas na mesma candidatura');

-- 13-14) Renovar uma vez
select lives_ok(
  $$select public.renew_reserve('e8300000-0000-0000-0000-0000000000c1',
    'Voce segue na fase final do processo seletivo. O proximo retorno sai ate 19/11.')$$,
  'deve permitir: 1 renovacao avisada');
select throws_ok(
  $$select public.renew_reserve('e8300000-0000-0000-0000-0000000000c1',
    'Voce segue na fase final do processo seletivo.')$$,
  'P0001', 'renewal_limit_reached', 'deve bloquear: segunda renovacao');

-- 15) R1 le a reserva
select is(
  (select count(*)::int from public.application_reserves
    where application_id = 'e8300000-0000-0000-0000-0000000000c1'),
  1, 'dono da vaga le a reserva');

reset role;

-- 16-17) Outro recrutador nao reserva nem le
set local role authenticated;
set local request.jwt.claims = '{"sub": "e8300000-0000-0000-0000-000000000002"}';
select throws_ok(
  $$select public.renew_reserve('e8300000-0000-0000-0000-0000000000c1',
    'Voce segue na fase final do processo seletivo.')$$,
  '42501', 'not_allowed', 'deve bloquear: recrutador de outra vaga');
select is(
  (select count(*)::int from public.application_reserves), 0,
  'recrutador de outra vaga nao le a reserva');
reset role;

-- 18-19) O candidato nunca ve a reserva nem consegue reservar
set local role authenticated;
set local request.jwt.claims = '{"sub": "e8300000-0000-0000-0000-000000000003"}';
select is(
  (select count(*)::int from public.application_reserves), 0,
  'o candidato nao le a propria reserva (e interna)');
select throws_ok(
  $$select public.put_on_reserve('e8300000-0000-0000-0000-0000000000c1',
    'Voce esta na fase final do processo seletivo.')$$,
  '42501', 'not_allowed', 'deve bloquear: candidato chamando a funcao');
reset role;

-- 20-22) Mudar de etapa encerra a reserva
set local role authenticated;
set local request.jwt.claims = '{"sub": "e8300000-0000-0000-0000-000000000001"}';
update public.applications set current_stage = 'approved'
  where id = 'e8300000-0000-0000-0000-0000000000c1';
select is(
  (select end_stage::text from public.application_reserves
    where application_id = 'e8300000-0000-0000-0000-0000000000c1'),
  'approved', 'aprovar o finalista encerra a reserva');
select throws_ok(
  $$select public.renew_reserve('e8300000-0000-0000-0000-0000000000c1',
    'Voce segue na fase final do processo seletivo.')$$,
  'P0001', 'not_reserved', 'deve bloquear: renovar reserva encerrada');
reset role;

set local role anon;
select throws_ok(
  $$select public.put_on_reserve('e8300000-0000-0000-0000-0000000000c1',
    'Voce esta na fase final do processo seletivo.')$$,
  '42501', NULL, 'deve bloquear: anonimo');
reset role;

select * from finish();

rollback;
