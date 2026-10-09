-- Testes pgTAP do log de e-mails do retorno em lote (N15a): reserva (pending),
-- decisao unica por candidatura+etapa e e-mail do candidato fora do alcance do recrutador.
create extension if not exists pgtap with schema extensions;

begin;

select plan(11);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'lote.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Lote R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e3000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'lote.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Lote C1"}', now(), now(), '', '', '', '');

update public.recruiter_profiles set approved_at = now()
  where user_id = 'e1000000-0000-0000-0000-000000000001';

insert into public.jobs (id, recruiter_id, title, employment_type, status)
values ('e9000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000001',
        'Vaga lote R1', 'CLT', 'active');

insert into public.applications (id, job_id, candidate_id)
values ('ea000000-0000-0000-0000-00000000000a', 'e9000000-0000-0000-0000-000000000009',
        'e3000000-0000-0000-0000-000000000003');

-- 1) Reserva (pending) de uma decisao
select lives_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage, feedback_kind)
    values ('e1000000-0000-0000-0000-000000000001', 'batch_feedback', 'lote.c1@test.local',
            'pending', 'ea000000-0000-0000-0000-00000000000a', 'screening', 'decision')$$,
  'status pending e aceito');

-- 2-3) A mesma decisao nao pode ser reservada nem enviada de novo
select throws_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage, feedback_kind)
    values ('e1000000-0000-0000-0000-000000000001', 'batch_feedback', 'lote.c1@test.local',
            'pending', 'ea000000-0000-0000-0000-00000000000a', 'screening', 'decision')$$,
  '23505', NULL, 'segunda reserva da mesma decisao e recusada');

update public.email_log set status = 'sent', provider_id = 'prov-1'
  where application_id = 'ea000000-0000-0000-0000-00000000000a';
select throws_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage, feedback_kind)
    values ('e1000000-0000-0000-0000-000000000001', 'batch_feedback', 'lote.c1@test.local',
            'sent', 'ea000000-0000-0000-0000-00000000000a', 'screening', 'decision')$$,
  '23505', NULL, 'decisao ja enviada nao e enviada de novo');

-- 4) Outra etapa da mesma candidatura e permitida
select lives_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage, feedback_kind)
    values ('e1000000-0000-0000-0000-000000000001', 'batch_feedback', 'lote.c1@test.local',
            'sent', 'ea000000-0000-0000-0000-00000000000a', 'interview', 'decision')$$,
  'a mesma candidatura em outra etapa pode ter nova decisao');

-- 5) Envio que falhou libera nova tentativa
update public.email_log set status = 'failed', error = 'timeout'
  where application_id = 'ea000000-0000-0000-0000-00000000000a' and stage = 'screening';
select lives_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage, feedback_kind)
    values ('e1000000-0000-0000-0000-000000000001', 'batch_feedback', 'lote.c1@test.local',
            'pending', 'ea000000-0000-0000-0000-00000000000a', 'screening', 'decision')$$,
  'depois de uma falha, a decisao pode ser reservada de novo');

-- 6) Atualizacoes honestas nao sao limitadas pelo indice
select lives_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage, feedback_kind)
    values
      ('e1000000-0000-0000-0000-000000000001', 'batch_feedback', 'lote.c1@test.local',
       'sent', 'ea000000-0000-0000-0000-00000000000a', 'screening', 'update'),
      ('e1000000-0000-0000-0000-000000000001', 'batch_feedback', 'lote.c1@test.local',
       'sent', 'ea000000-0000-0000-0000-00000000000a', 'screening', 'update')$$,
  'atualizacoes na mesma etapa nao sao bloqueadas pelo indice de decisao');

-- 7) Tipo invalido
select throws_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage, feedback_kind)
    values ('e1000000-0000-0000-0000-000000000001', 'batch_feedback', 'a@b.c',
            'sent', 'ea000000-0000-0000-0000-00000000000a', 'screening', 'other')$$,
  '23514', NULL, 'feedback_kind fora de decision/update e recusado');

-- 8-10) O recrutador le o log, mas nao o e-mail do candidato
set local role authenticated;
set local request.jwt.claims = '{"sub": "e1000000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.email_log
    where application_id = 'ea000000-0000-0000-0000-00000000000a'),
  5, 'recrutador le as proprias linhas do lote');
select lives_ok(
  $$select id, template, status, application_id, stage, feedback_kind, error from public.email_log$$,
  'recrutador le status, etapa e erro');
select throws_ok(
  $$select to_email from public.email_log$$,
  '42501', NULL, 'recrutador nao le o e-mail do candidato');

-- 11) Candidato nao ve nada
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "e3000000-0000-0000-0000-000000000003"}';
select is((select count(*)::int from public.email_log), 0, 'candidato nao ve o log');

select * from finish();
rollback;
