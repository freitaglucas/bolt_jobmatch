-- Testes pgTAP do aviso de mudanca de etapa (N71): um aviso por candidatura+etapa,
-- sem atrapalhar o retorno em lote (batch_feedback).
create extension if not exists pgtap with schema extensions;

begin;

select plan(6);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'aviso.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Aviso R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'f3000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'aviso.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Aviso C1"}', now(), now(), '', '', '', '');

update public.recruiter_profiles set approved_at = now()
  where user_id = 'f1000000-0000-0000-0000-000000000001';

insert into public.jobs (id, recruiter_id, title, employment_type, status)
values ('f9000000-0000-0000-0000-000000000009', 'f1000000-0000-0000-0000-000000000001',
        'Vaga aviso R1', 'CLT', 'active');

insert into public.applications (id, job_id, candidate_id)
values ('fa000000-0000-0000-0000-00000000000a', 'f9000000-0000-0000-0000-000000000009',
        'f3000000-0000-0000-0000-000000000003');

-- 1) Reserva do aviso da etapa
select lives_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage)
    values ('f1000000-0000-0000-0000-000000000001', 'stage_update', 'aviso.c1@test.local',
            'pending', 'fa000000-0000-0000-0000-00000000000a', 'screening')$$,
  'aviso de mudanca de etapa pode ser reservado');

-- 2) O mesmo aviso (mesma candidatura e etapa) e recusado
select throws_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage)
    values ('f1000000-0000-0000-0000-000000000001', 'stage_update', 'aviso.c1@test.local',
            'pending', 'fa000000-0000-0000-0000-00000000000a', 'screening')$$,
  '23505', NULL, 'segundo aviso da mesma etapa e recusado');

-- 3) Outra etapa da mesma candidatura e permitida
select lives_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage)
    values ('f1000000-0000-0000-0000-000000000001', 'stage_update', 'aviso.c1@test.local',
            'sent', 'fa000000-0000-0000-0000-00000000000a', 'interview')$$,
  'a proxima etapa tem o proprio aviso');

-- 4) Envio que falhou libera nova tentativa
update public.email_log set status = 'failed', error = 'timeout'
  where application_id = 'fa000000-0000-0000-0000-00000000000a' and stage = 'screening';
select lives_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage)
    values ('f1000000-0000-0000-0000-000000000001', 'stage_update', 'aviso.c1@test.local',
            'pending', 'fa000000-0000-0000-0000-00000000000a', 'screening')$$,
  'depois de uma falha, o aviso pode ser reservado de novo');

-- 5) O aviso nao atrapalha a decisao do retorno em lote na mesma etapa
select lives_ok(
  $$insert into public.email_log
      (recruiter_id, template, to_email, status, application_id, stage, feedback_kind)
    values ('f1000000-0000-0000-0000-000000000001', 'batch_feedback', 'aviso.c1@test.local',
            'sent', 'fa000000-0000-0000-0000-00000000000a', 'screening', 'decision')$$,
  'decisao do lote e aviso de etapa nao se bloqueiam');

-- 6) O recrutador nao le o e-mail do candidato nas linhas do aviso
set local role authenticated;
set local request.jwt.claims = '{"sub": "f1000000-0000-0000-0000-000000000001"}';
select throws_ok(
  $$select to_email from public.email_log$$,
  '42501', NULL, 'recrutador nao le o e-mail do candidato');

select * from finish();
rollback;
