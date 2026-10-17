-- Testes pgTAP da meta de retorno no prazo (N16).
create extension if not exists pgtap with schema extensions;

begin;

select plan(15);

-- Fixtures: R1 e R2 aprovados, R3 nao aprovado, 3 candidatos.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'goal.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Goal R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'goal.r2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Goal R2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a3000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'goal.r3@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Goal R3 nao aprovado"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a4000000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'goal.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Goal C1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a5000000-0000-0000-0000-000000000005',
   'authenticated', 'authenticated', 'goal.c2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Goal C2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a6000000-0000-0000-0000-000000000006',
   'authenticated', 'authenticated', 'goal.c3@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Goal C3"}', now(), now(), '', '', '', '');

update public.recruiter_profiles set approved_at = now()
  where user_id in ('a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002');

insert into public.jobs (id, recruiter_id, title, employment_type, status) values
  ('a9000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Vaga meta R1', 'CLT', 'active'),
  ('a9000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002',
   'Vaga meta R2', 'CLT', 'active'),
  ('a9000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003',
   'Vaga meta R3', 'CLT', 'active');

insert into public.applications (id, job_id, candidate_id) values
  ('ae000000-0000-0000-0000-000000000001', 'a9000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004'),
  ('ae000000-0000-0000-0000-000000000002', 'a9000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005'),
  ('ae000000-0000-0000-0000-000000000003', 'a9000000-0000-0000-0000-000000000002', 'a6000000-0000-0000-0000-000000000006'),
  ('ae000000-0000-0000-0000-000000000004', 'a9000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000004');

-- Prazos controlados (apaga os que os gatilhos criaram).
delete from public.feedback_deadlines;

insert into public.feedback_deadlines (application_id, stage, due_at, met_at) values
  -- Vaga R1, candidatura 1
  ('ae000000-0000-0000-0000-000000000001', 'screening', now() + interval '1 day',  now() - interval '2 days'),  -- no prazo (retorno antecipado)
  ('ae000000-0000-0000-0000-000000000001', 'screening', now() - interval '2 days', now() - interval '3 days'),  -- no prazo
  ('ae000000-0000-0000-0000-000000000001', 'screening', now() - interval '3 days', now() - interval '1 day'),   -- atrasado
  ('ae000000-0000-0000-0000-000000000001', 'screening', now() - interval '40 days', now() - interval '41 days'), -- no prazo, mas fora do periodo de 30 dias
  ('ae000000-0000-0000-0000-000000000001', 'screening', now() + interval '2 days', null),                       -- aberto dentro do prazo: nao conta
  -- Vaga R1, candidatura 2: aberto e vencido (atrasado)
  ('ae000000-0000-0000-0000-000000000002', 'screening', now() - interval '1 day', null),
  -- Vaga R2
  ('ae000000-0000-0000-0000-000000000003', 'screening', now() + interval '1 day', now() - interval '1 day'),
  -- Vaga R3 (recrutador nao aprovado)
  ('ae000000-0000-0000-0000-000000000004', 'screening', now() + interval '1 day', now() - interval '1 day');

-- 1-2) Constantes
select is(public.feedback_goal_target(), 0.90::numeric, 'meta de 90%');
select is(public.feedback_goal_discount(), 0.10::numeric, 'desconto de 10%');

-- 3-5) R1 ve so a propria vaga, com 4 prazos no periodo e 2 no prazo
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.feedback_goal_attainment(now() - interval '30 days')),
  1, 'R1 recebe so a linha da propria vaga');
select is(
  (select total from public.feedback_goal_attainment(now() - interval '30 days')),
  4, 'total: 2 no prazo + 1 atrasado + 1 aberto vencido (aberto no prazo e prazo antigo ficam de fora)');
select is(
  (select on_time from public.feedback_goal_attainment(now() - interval '30 days')),
  2, 'no prazo: so met_at <= due_at');

-- 6) Janela maior inclui o prazo antigo (cumprido no prazo)
select is(
  (select total || '/' || on_time from public.feedback_goal_attainment(now() - interval '60 days')),
  '5/3', 'janela de 60 dias inclui o prazo antigo');

-- 7) Padrao: desde o inicio do mes, nunca mais prazos do que a janela de 60 dias
select ok(
  (select coalesce(sum(total), 0) from public.feedback_goal_attainment()) <= 5,
  'valor padrao de _since e o inicio do mes');

-- 8-9) R2 ve so a propria vaga
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-0000-0000-000000000002"}';

select is(
  (select total || '/' || on_time from public.feedback_goal_attainment(now() - interval '30 days')),
  '1/1', 'R2 so ve os proprios prazos');
select is(
  (select count(*)::int from public.feedback_goal_attainment(now() - interval '30 days')
    where job_id = 'a9000000-0000-0000-0000-000000000001'),
  0, 'R2 nao ve a vaga do R1');

-- 10) Recrutador nao aprovado recebe zero linhas
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a3000000-0000-0000-0000-000000000003"}';

select is(
  (select count(*)::int from public.feedback_goal_attainment(now() - interval '30 days')),
  0, 'recrutador nao aprovado nao recebe linhas');

-- 11) Candidato recebe zero linhas
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a4000000-0000-0000-0000-000000000004"}';

select is(
  (select count(*)::int from public.feedback_goal_attainment(now() - interval '30 days')),
  0, 'candidato nao recebe linhas');

-- 12) anon nao executa
reset role;
set local role anon;
select throws_ok(
  $$select * from public.feedback_goal_attainment()$$,
  '42501', NULL, 'anon nao executa feedback_goal_attainment');

-- 13-14) O credito de token por feedback acabou
reset role;
select hasnt_trigger('public', 'feedbacks', 'feedbacks_credit_tokens',
  'gatilho de credito por feedback removido');
select hasnt_function('public', 'credit_token_for_timely_feedback',
  'funcao de credito por feedback removida');

-- 15) Enviar feedback nao grava credito novo no ledger
insert into public.feedbacks (application_id, author_id, content, sent_to_candidate_at)
values ('ae000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
        'Feedback sem credito', now());
select is(
  (select count(*)::int from public.token_ledger where kind = 'feedback_credit'),
  0, 'enviar feedback nao grava feedback_credit');

select * from finish();
rollback;
