-- pgTAP: grupos de alternativas na vaga (N33a). O score com grupos esta em
-- match_parity.test.sql.

create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'e4100000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'grp.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Grp R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e4100000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'grp.r2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Grp R2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e4200000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'grp.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Grp C1"}', now(), now(), '', '', '', '');

update public.recruiter_profiles set approved_at = now()
  where user_id in ('e4100000-0000-0000-0000-000000000001', 'e4100000-0000-0000-0000-000000000002');

insert into public.skills (id, name, category, kind) values
  ('e4300000-0000-0000-0000-000000000001', 'Grp AWS', 'hard', 'tool'),
  ('e4300000-0000-0000-0000-000000000002', 'Grp GCP', 'hard', 'tool'),
  ('e4300000-0000-0000-0000-000000000003', 'Grp Azure', 'hard', 'tool');

insert into public.jobs (id, recruiter_id, title, employment_type, status) values
  ('e4400000-0000-0000-0000-000000000001', 'e4100000-0000-0000-0000-000000000001',
   'Engenharia de nuvem', 'CLT', 'active'),
  ('e4400000-0000-0000-0000-000000000002', 'e4100000-0000-0000-0000-000000000001',
   'Outra vaga', 'CLT', 'active');

-- 1-2) A dona da vaga cria o grupo; outra recrutadora nao
set local role authenticated;
set local request.jwt.claims = '{"sub": "e4100000-0000-0000-0000-000000000001"}';

select lives_ok(
  $$insert into public.job_skill_groups (id, job_id, min_count, role)
    values ('e4500000-0000-0000-0000-000000000001', 'e4400000-0000-0000-0000-000000000001', 1, 'required')$$,
  'R1 cria o grupo "1 de" na propria vaga');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "e4100000-0000-0000-0000-000000000002"}';

select throws_ok(
  $$insert into public.job_skill_groups (job_id, min_count)
    values ('e4400000-0000-0000-0000-000000000001', 1)$$,
  '42501', NULL, 'R2 nao cria grupo na vaga de R1');

reset role;

-- 3) Minimo fora da faixa
select throws_ok(
  $$insert into public.job_skill_groups (job_id, min_count)
    values ('e4400000-0000-0000-0000-000000000001', 0)$$,
  '23514', NULL, 'minimo zero e recusado');

-- 4-5) Item no grupo herda o papel
insert into public.job_skills (job_id, skill_id, required_level, weight, role, group_id) values
  ('e4400000-0000-0000-0000-000000000001', 'e4300000-0000-0000-0000-000000000001', 2, 1, 'preferred',
   'e4500000-0000-0000-0000-000000000001'),
  ('e4400000-0000-0000-0000-000000000001', 'e4300000-0000-0000-0000-000000000002', 2, 1, 'implicit',
   'e4500000-0000-0000-0000-000000000001');

select is(
  (select array_agg(distinct role) from public.job_skills
    where group_id = 'e4500000-0000-0000-0000-000000000001'),
  array['required'], 'itens do grupo herdam o papel obrigatorio');

select is(
  (select bool_and(mandatory) from public.job_skills
    where group_id = 'e4500000-0000-0000-0000-000000000001'),
  true, 'itens do grupo obrigatorio ficam mandatory');

-- 6) Grupo de outra vaga
select throws_ok(
  $$insert into public.job_skills (job_id, skill_id, required_level, weight, group_id)
    values ('e4400000-0000-0000-0000-000000000002', 'e4300000-0000-0000-0000-000000000003', 2, 1,
            'e4500000-0000-0000-0000-000000000001')$$,
  '23514', NULL, 'item nao entra em grupo de outra vaga');

-- 7-8) Mudou o papel do grupo: os itens acompanham
update public.job_skill_groups set role = 'preferred'
where id = 'e4500000-0000-0000-0000-000000000001';

select is(
  (select array_agg(distinct role) from public.job_skills
    where group_id = 'e4500000-0000-0000-0000-000000000001'),
  array['preferred'], 'itens seguem o novo papel do grupo');

select is(
  (select bool_or(mandatory) from public.job_skills
    where group_id = 'e4500000-0000-0000-0000-000000000001'),
  false, 'itens do grupo desejavel deixam de ser mandatory');

-- 9-10) Leitura
set local role authenticated;
set local request.jwt.claims = '{"sub": "e4200000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.job_skill_groups
    where job_id = 'e4400000-0000-0000-0000-000000000001'),
  1, 'candidato le o grupo da vaga ativa');

reset role;
set local role anon;

select throws_ok(
  $$select count(*) from public.job_skill_groups$$,
  '42501', NULL, 'anonimo nao le grupos');

reset role;

-- 11-12) Apagar o grupo solta os itens
delete from public.job_skill_groups where id = 'e4500000-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from public.job_skills
    where job_id = 'e4400000-0000-0000-0000-000000000001' and group_id is null),
  2, 'itens ficam na vaga sem grupo');

select is(
  (select count(*)::int from public.job_skills
    where job_id = 'e4400000-0000-0000-0000-000000000001'),
  2, 'nenhum item some com o grupo');

select * from finish();
rollback;