-- pgTAP: regua de 3 niveis (N30). Vaga e candidato so aceitam 1 (basico),
-- 2 (intermediario) ou 3 (avancado); nao existe nivel 4 ou 5.

create extension if not exists pgtap with schema extensions;

begin;

select plan(10);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'a3000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'regua.candidato@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Candidato Regua"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c3000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'regua.recrutador@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Recrutador Regua"}', now(), now(), '', '', '', '');

insert into public.skills (id, name, category) values
  ('b3000000-0000-0000-0000-000000000001', 'Regua A', 'hard'),
  ('b3000000-0000-0000-0000-000000000002', 'Regua B', 'hard');

insert into public.jobs (id, recruiter_id, title, employment_type, status)
values ('d3000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000002',
        'Vaga da regua', 'CLT', 'draft');

-- 1-5) Nivel exigido pela vaga
select lives_ok(
  $$insert into public.job_skills (job_id, skill_id, required_level, weight, mandatory)
    values ('d3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 1, 1, true)$$,
  'vaga aceita nivel 1 (basico)');
select lives_ok(
  $$insert into public.job_skills (job_id, skill_id, required_level, weight, mandatory)
    values ('d3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000002', 3, 1, false)$$,
  'vaga aceita nivel 3 (avancado)');
select throws_ok(
  $$update public.job_skills set required_level = 4
    where job_id = 'd3000000-0000-0000-0000-000000000001'
      and skill_id = 'b3000000-0000-0000-0000-000000000001'$$,
  '23514', NULL, 'vaga nao aceita nivel 4');
select throws_ok(
  $$update public.job_skills set required_level = 5
    where job_id = 'd3000000-0000-0000-0000-000000000001'
      and skill_id = 'b3000000-0000-0000-0000-000000000001'$$,
  '23514', NULL, 'vaga nao aceita nivel 5');
select throws_ok(
  $$update public.job_skills set required_level = 0
    where job_id = 'd3000000-0000-0000-0000-000000000001'
      and skill_id = 'b3000000-0000-0000-0000-000000000001'$$,
  '23514', NULL, 'vaga nao aceita nivel 0');

-- 6-8) Nivel do candidato
select lives_ok(
  $$insert into public.candidate_skills (candidate_id, skill_id, declared_level)
    values ('a3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 2)$$,
  'candidato aceita nivel 2 (intermediario)');
select throws_ok(
  $$update public.candidate_skills set declared_level = 4
    where candidate_id = 'a3000000-0000-0000-0000-000000000001'$$,
  '23514', NULL, 'candidato nao aceita nivel 4');
select throws_ok(
  $$update public.candidate_skills set declared_level = 0
    where candidate_id = 'a3000000-0000-0000-0000-000000000001'$$,
  '23514', NULL, 'candidato nao aceita nivel 0');

-- 9) Bonus de projeto tem teto 3: avancado com projeto numa vaga avancada = 100
delete from public.job_skills where job_id = 'd3000000-0000-0000-0000-000000000001';
insert into public.job_skills (job_id, skill_id, required_level, weight, mandatory)
values ('d3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 3, 1, false);
update public.candidate_skills
set declared_level = 3, evidenced_by_project = true
where candidate_id = 'a3000000-0000-0000-0000-000000000001';

select is(
  public.calculate_application_match_score(
    'd3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001'),
  100::numeric,
  'avancado com projeto atende vaga avancada (teto 3)');

-- 10) Intermediario numa vaga avancada pontua 2/3
update public.candidate_skills
set declared_level = 2, evidenced_by_project = false
where candidate_id = 'a3000000-0000-0000-0000-000000000001';

select is(
  public.calculate_application_match_score(
    'd3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001'),
  66.67::numeric,
  'intermediario numa vaga avancada pontua 66,67');

select * from finish();
rollback;
