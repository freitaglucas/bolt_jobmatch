-- Testes pgTAP do prazo de retorno (N63): abrir, cumprir, adiar, limite de
-- adiamentos, atraso e acesso negado a outra vaga.
create extension if not exists pgtap with schema extensions;

begin;

select plan(40);

-- Fixtures: R1/R2 recrutadores aprovados, 5 candidatos, 1 vaga do R1, 5 candidaturas.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'fd.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"FD R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'fd.r2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"FD R2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a3000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'fd.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"FD C1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a4000000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'fd.c2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"FD C2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a5000000-0000-0000-0000-000000000005',
   'authenticated', 'authenticated', 'fd.c3@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"FD C3"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a6000000-0000-0000-0000-000000000006',
   'authenticated', 'authenticated', 'fd.c4@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"FD C4"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a7000000-0000-0000-0000-000000000007',
   'authenticated', 'authenticated', 'fd.c5@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"FD C5"}', now(), now(), '', '', '', '');

update public.recruiter_profiles set approved_at = now()
  where user_id in ('a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002');

insert into public.jobs (id, recruiter_id, title, employment_type, status)
values ('a9000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001',
        'Vaga prazos R1', 'CLT', 'active');

insert into public.applications (id, job_id, candidate_id) values
  ('b1000000-0000-0000-0000-000000000001', 'a9000000-0000-0000-0000-000000000009', 'a3000000-0000-0000-0000-000000000003'),
  ('b2000000-0000-0000-0000-000000000002', 'a9000000-0000-0000-0000-000000000009', 'a4000000-0000-0000-0000-000000000004'),
  ('b3000000-0000-0000-0000-000000000003', 'a9000000-0000-0000-0000-000000000009', 'a5000000-0000-0000-0000-000000000005'),
  ('b4000000-0000-0000-0000-000000000004', 'a9000000-0000-0000-0000-000000000009', 'a6000000-0000-0000-0000-000000000006'),
  ('b5000000-0000-0000-0000-000000000005', 'a9000000-0000-0000-0000-000000000009', 'a7000000-0000-0000-0000-000000000007');

-- 1-3) Constantes e tabela
select has_table('public', 'feedback_deadlines', 'tabela feedback_deadlines existe');
select is((select public.max_feedback_postpones()), 2, 'limite de 2 adiamentos por etapa');
select is((select public.max_feedback_postpone_days()), 14, 'adiamento de no maximo 14 dias');

-- 4-5) Candidatura criada abre um prazo com o SLA da etapa
select is(
  (select count(*)::int from public.feedback_deadlines d
    where d.met_at is null and d.postpone_no = 0 and d.stage = 'new_application'
      and d.application_id in (select id from public.applications
        where job_id = 'a9000000-0000-0000-0000-000000000009')),
  5, 'cada candidatura nova abre um prazo aberto na etapa Em analise');
select is(
  (select count(*)::int from public.feedback_deadlines d
    join public.applications a on a.id = d.application_id
    where a.job_id = 'a9000000-0000-0000-0000-000000000009'
      and d.due_at = a.created_at + public.feedback_sla()),
  5, 'o prazo nasce do SLA da etapa (5 dias)');

-- 6) No maximo um prazo aberto por candidatura
select throws_ok(
  $$insert into public.feedback_deadlines (application_id, stage, due_at)
    values ('b1000000-0000-0000-0000-000000000001', 'new_application', now() + interval '1 day')$$,
  '23505', NULL, 'nao permite dois prazos abertos na mesma candidatura');

-- Como R1 (dono da vaga)
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-0000-0000-000000000001"}';

-- 7-10) Mudar de etapa cumpre o prazo e abre o da nova etapa
update public.applications set current_stage = 'screening'
  where id = 'b1000000-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.feedback_deadlines
    where application_id = 'b1000000-0000-0000-0000-000000000001'),
  2, 'mudar de etapa gera um segundo prazo');
select is(
  (select count(*)::int from public.feedback_deadlines
    where application_id = 'b1000000-0000-0000-0000-000000000001'
      and stage = 'new_application' and met_at is not null),
  1, 'o prazo da etapa anterior fica cumprido');
select is(
  (select stage::text from public.feedback_deadlines
    where application_id = 'b1000000-0000-0000-0000-000000000001' and met_at is null),
  'screening', 'o prazo aberto e o da nova etapa');
select is(
  (select postpone_no::int from public.feedback_deadlines
    where application_id = 'b1000000-0000-0000-0000-000000000001' and met_at is null),
  0, 'a nova etapa comeca sem adiamentos');

-- 11) Rejeitar cumpre o prazo e nao abre outro
update public.applications set current_stage = 'rejected'
  where id = 'b1000000-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.feedback_deadlines
    where application_id = 'b1000000-0000-0000-0000-000000000001' and met_at is null),
  0, 'etapa final nao tem prazo aberto');

-- 12-13) Feedback de decisao cumpre o prazo e abre o proximo, sem mexer nos adiamentos
insert into public.feedbacks (application_id, author_id, content, sent_to_candidate_at)
values ('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
        'Seguimos com outros perfis nesta etapa.', now());
select is(
  (select count(*)::int from public.feedback_deadlines
    where application_id = 'b2000000-0000-0000-0000-000000000002'),
  2, 'feedback de decisao fecha o prazo e abre o proximo');
select is(
  (select postpone_no::int from public.feedback_deadlines
    where application_id = 'b2000000-0000-0000-0000-000000000002' and met_at is null),
  0, 'feedback de decisao nao consome adiamento');

-- 14) Rascunho (nao enviado) nao cumpre o prazo
insert into public.feedbacks (application_id, author_id, content)
values ('b3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
        'Rascunho ainda nao enviado.');
select is(
  (select count(*)::int from public.feedback_deadlines
    where application_id = 'b3000000-0000-0000-0000-000000000003'),
  1, 'rascunho nao cumpre o prazo');

-- 15-19) Atualizacao honesta com nova data
select is(
  (select public.postpone_feedback('b3000000-0000-0000-0000-000000000003',
     now() + interval '7 days', 'Seguimos analisando seu perfil.')),
  now() + interval '7 days', 'postpone_feedback devolve a nova data');
select is(
  (select due_at from public.feedback_deadlines
    where application_id = 'b3000000-0000-0000-0000-000000000003' and met_at is null),
  now() + interval '7 days', 'o prazo aberto passa a ser a nova data');
select is(
  (select postpone_no::int from public.feedback_deadlines
    where application_id = 'b3000000-0000-0000-0000-000000000003' and met_at is null),
  1, 'o primeiro adiamento e contado');
select is(
  (select count(*)::int from public.feedbacks
    where application_id = 'b3000000-0000-0000-0000-000000000003'
      and kind = 'update' and sent_to_candidate_at is not null),
  1, 'a atualizacao fica registrada como feedback enviado ao candidato');
select isnt(
  (select feedback_sent_at from public.applications
    where id = 'b3000000-0000-0000-0000-000000000003'),
  null, 'feedback_sent_at da candidatura e preenchido');

-- 20-21) Segundo adiamento vale; o terceiro bate no limite
select lives_ok(
  $$select public.postpone_feedback('b3000000-0000-0000-0000-000000000003',
      now() + interval '10 days', 'Ainda aguardando a agenda da gestora.')$$,
  'segundo adiamento e permitido');
select throws_ok(
  $$select public.postpone_feedback('b3000000-0000-0000-0000-000000000003',
      now() + interval '13 days', 'Terceira tentativa de adiar.')$$,
  'P0001', 'postpone_limit_reached', 'terceiro adiamento na mesma etapa e recusado');

-- 22-23) Nova etapa zera os adiamentos
update public.applications set current_stage = 'interview'
  where id = 'b3000000-0000-0000-0000-000000000003';
select is(
  (select postpone_no::int from public.feedback_deadlines
    where application_id = 'b3000000-0000-0000-0000-000000000003' and met_at is null),
  0, 'mudar de etapa zera a contagem de adiamentos');
select lives_ok(
  $$select public.postpone_feedback('b3000000-0000-0000-0000-000000000003',
      now() + interval '8 days', 'Marcando a entrevista com a gestora.')$$,
  'na nova etapa o adiamento volta a ser permitido');

-- 24-27) Validacoes
select throws_ok(
  $$select public.postpone_feedback('b4000000-0000-0000-0000-000000000004',
      now() + interval '15 days', 'Prazo longo demais para adiar.')$$,
  'P0001', 'postpone_too_long', 'adiamento acima de 14 dias e recusado');
select throws_ok(
  $$select public.postpone_feedback('b4000000-0000-0000-0000-000000000004',
      now() + interval '2 days', 'Data anterior ao prazo atual.')$$,
  '22023', 'invalid_due_date', 'nova data antes do prazo atual e recusada');
select throws_ok(
  $$select public.postpone_feedback('b4000000-0000-0000-0000-000000000004',
      now() + interval '8 days', 'curto')$$,
  '22023', 'invalid_message', 'mensagem curta demais e recusada');
select throws_ok(
  $$select public.postpone_feedback('b1000000-0000-0000-0000-000000000001',
      now() + interval '8 days', 'Candidatura ja encerrada.')$$,
  'P0001', 'stage_without_deadline', 'etapa final nao aceita adiamento');

-- 28) Retorno depois do vencimento fecha o prazo como atrasado (met_at > due_at)
reset role;
update public.feedback_deadlines set due_at = now() - interval '1 day'
  where application_id = 'b5000000-0000-0000-0000-000000000005' and met_at is null;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-0000-0000-000000000001"}';
update public.applications set current_stage = 'screening'
  where id = 'b5000000-0000-0000-0000-000000000005';
select is(
  (select count(*)::int from public.feedback_deadlines
    where application_id = 'b5000000-0000-0000-0000-000000000005' and met_at > due_at),
  1, 'contato apos o vencimento fica registrado como atrasado');

-- 29-31) O recrutador nao grava kind/reason_code nem mexe nos prazos direto
select throws_ok(
  $$insert into public.feedbacks (application_id, author_id, content, kind, sent_to_candidate_at)
    values ('b4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001',
            'Tentando burlar o limite.', 'update', now())$$,
  '42501', NULL, 'recrutador nao insere feedback kind = update direto');
select throws_ok(
  $$update public.feedback_deadlines set due_at = now() + interval '30 days'$$,
  '42501', NULL, 'recrutador nao altera prazos');
select throws_ok(
  $$insert into public.feedback_deadlines (application_id, stage, due_at, met_at)
    values ('b4000000-0000-0000-0000-000000000004', 'screening', now(), now())$$,
  '42501', NULL, 'recrutador nao insere prazos');

-- 32-34) Outro recrutador: nada lido, nada adiado
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-0000-0000-000000000002"}';
select is(
  (select count(*)::int from public.feedback_deadlines),
  0, 'R2 nao ve prazos de vagas do R1');
select throws_ok(
  $$select public.postpone_feedback('b4000000-0000-0000-0000-000000000004',
      now() + interval '8 days', 'Tentativa de outro recrutador.')$$,
  '42501', 'not_allowed', 'R2 nao adia candidatura de vaga do R1');
select is(
  (select count(*)::int from public.feedbacks
    where application_id = 'b4000000-0000-0000-0000-000000000004'),
  0, 'nenhum feedback foi gravado pela tentativa negada');

-- 35-37) Candidato: le so os proprios prazos e nao adia
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a3000000-0000-0000-0000-000000000003"}';
select is(
  (select count(*)::int from public.feedback_deadlines
    where application_id <> 'b1000000-0000-0000-0000-000000000001'),
  0, 'candidato nao ve prazos de outras candidaturas');
select is(
  (select count(*)::int from public.feedback_deadlines
    where application_id = 'b1000000-0000-0000-0000-000000000001'),
  2, 'candidato ve os proprios prazos');
select throws_ok(
  $$select public.postpone_feedback('b1000000-0000-0000-0000-000000000001',
      now() + interval '8 days', 'Candidato tentando adiar.')$$,
  '42501', 'not_allowed', 'candidato nao adia prazo');

-- 38) Anonimo
reset role;
set local role anon;
select throws_ok(
  $$select 1 from public.feedback_deadlines$$,
  '42501', NULL, 'anon nao acessa feedback_deadlines');

-- 39-40) Funcoes internas nao sao chamaveis por anon
select throws_ok(
  $$select public.postpone_feedback('b1000000-0000-0000-0000-000000000001',
      now() + interval '8 days', 'Anonimo tentando adiar.')$$,
  '42501', NULL, 'anon nao executa postpone_feedback');
reset role;
select hasnt_trigger('public', 'applications', 'applications_charge_tokens',
  'gatilho de debito de tokens continua removido');

select * from finish();
rollback;
