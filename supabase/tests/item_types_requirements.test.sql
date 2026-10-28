-- pgTAP: tipos de item, papel na vaga e requisitos sim/nao (N31a).

create extension if not exists pgtap with schema extensions;

begin;

select plan(32);

-- Fixtures: R1 e R2 recrutadores aprovados, C1, C2 e C3 candidatos.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'e3100000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'req.r1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Req R1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e3100000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'req.r2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Req R2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e3200000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'req.c1@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Req C1"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e3200000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'req.c2@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Req C2"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e3200000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'req.c3@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Req C3"}', now(), now(), '', '', '', '');

update public.recruiter_profiles set approved_at = now()
  where user_id in ('e3100000-0000-0000-0000-000000000001', 'e3100000-0000-0000-0000-000000000002');

insert into public.skills (id, name, category, kind) values
  ('e3300000-0000-0000-0000-000000000001', 'Req Competencia', 'hard', 'competency'),
  ('e3300000-0000-0000-0000-000000000002', 'Req Ferramenta', 'hard', 'tool'),
  ('e3300000-0000-0000-0000-000000000003', 'Req Ponto forte', 'soft', 'trait');

insert into public.jobs (id, recruiter_id, title, employment_type, status) values
  ('e3400000-0000-0000-0000-000000000001', 'e3100000-0000-0000-0000-000000000001',
   'Motorista entregador', 'CLT', 'active');

-- 1-3) Catalogo
select has_column('public', 'skills', 'kind', 'skills tem o tipo do item');

select is(
  (select count(*)::int from public.skills
    where kind = 'requirement'
      and name in ('CNH categoria A', 'CNH categoria B', 'Trabalho presencial',
                   'Disponibilidade aos fins de semana', 'Trabalho em turnos ou escala',
                   'Disponibilidade para viagens', 'Registro ativo em conselho profissional',
                   'Início imediato')),
  8, 'os 8 requisitos comuns estao no catalogo');

select throws_ok(
  $$insert into public.skills (name, category, kind) values ('Tipo errado', 'hard', 'outro')$$,
  '23514', NULL, 'tipo fora da lista e recusado');

-- 4-9) job_skills: so competencia e ferramenta, papel sincronizado com mandatory
select throws_ok(
  $$insert into public.job_skills (job_id, skill_id, required_level, weight, mandatory)
    select 'e3400000-0000-0000-0000-000000000001', id, 2, 1, true
    from public.skills where name = 'CNH categoria B'$$,
  '23514', NULL, 'requisito nao entra em job_skills');

select throws_ok(
  $$insert into public.job_skills (job_id, skill_id, required_level, weight, mandatory)
    values ('e3400000-0000-0000-0000-000000000001', 'e3300000-0000-0000-0000-000000000003', 2, 1, false)$$,
  '23514', NULL, 'ponto forte nao entra em job_skills');

insert into public.job_skills (job_id, skill_id, required_level, weight, mandatory)
values ('e3400000-0000-0000-0000-000000000001', 'e3300000-0000-0000-0000-000000000001', 2, 1, true);

select is(
  (select role from public.job_skills
    where job_id = 'e3400000-0000-0000-0000-000000000001'
      and skill_id = 'e3300000-0000-0000-0000-000000000001'),
  'required', 'cliente antigo com mandatory = true vira obrigatorio');

insert into public.job_skills (job_id, skill_id, required_level, weight, role, mandatory)
values ('e3400000-0000-0000-0000-000000000001', 'e3300000-0000-0000-0000-000000000002', 2, 1, 'implicit', true);

select is(
  (select mandatory from public.job_skills
    where job_id = 'e3400000-0000-0000-0000-000000000001'
      and skill_id = 'e3300000-0000-0000-0000-000000000002'),
  false, 'implicito nunca fica obrigatorio');

update public.job_skills set mandatory = false
where job_id = 'e3400000-0000-0000-0000-000000000001'
  and skill_id = 'e3300000-0000-0000-0000-000000000001';

select is(
  (select role from public.job_skills
    where job_id = 'e3400000-0000-0000-0000-000000000001'
      and skill_id = 'e3300000-0000-0000-0000-000000000001'),
  'preferred', 'desmarcar obrigatorio vira desejavel');

update public.job_skills set role = 'required'
where job_id = 'e3400000-0000-0000-0000-000000000001'
  and skill_id = 'e3300000-0000-0000-0000-000000000001';

select is(
  (select mandatory from public.job_skills
    where job_id = 'e3400000-0000-0000-0000-000000000001'
      and skill_id = 'e3300000-0000-0000-0000-000000000001'),
  true, 'papel obrigatorio marca mandatory');

-- 10) candidate_skills: so competencia e ferramenta
insert into public.candidate_profiles (user_id) values ('e3200000-0000-0000-0000-000000000001')
on conflict (user_id) do nothing;
select throws_ok(
  $$insert into public.candidate_skills (candidate_id, skill_id, declared_level)
    select 'e3200000-0000-0000-0000-000000000001', id, 2
    from public.skills where name = 'CNH categoria A'$$,
  '23514', NULL, 'requisito nao entra no perfil de competencias');

-- 11-13) job_requirements: so requisito; a dona da vaga cria; outra recrutadora nao
select throws_ok(
  $$insert into public.job_requirements (job_id, skill_id)
    values ('e3400000-0000-0000-0000-000000000001', 'e3300000-0000-0000-0000-000000000001')$$,
  '23514', NULL, 'competencia nao entra em job_requirements');

set local role authenticated;
set local request.jwt.claims = '{"sub": "e3100000-0000-0000-0000-000000000001"}';

select lives_ok(
  $$insert into public.job_requirements (id, job_id, skill_id, detail, eliminatory)
    select 'e3500000-0000-0000-0000-000000000001', 'e3400000-0000-0000-0000-000000000001', id,
           '  moto não serve  ', true
    from public.skills where name = 'CNH categoria B'$$,
  'R1 cria requisito excludente na propria vaga');

insert into public.job_requirements (id, job_id, skill_id, eliminatory)
select 'e3500000-0000-0000-0000-000000000002', 'e3400000-0000-0000-0000-000000000001', id, false
from public.skills where name = 'Disponibilidade aos fins de semana';

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "e3100000-0000-0000-0000-000000000002"}';

select throws_ok(
  $$insert into public.job_requirements (job_id, skill_id)
    select 'e3400000-0000-0000-0000-000000000001', id
    from public.skills where name = 'Início imediato'$$,
  '42501', NULL, 'R2 nao cria requisito na vaga de R1');

reset role;

select is(
  (select detail from public.job_requirements where id = 'e3500000-0000-0000-0000-000000000001'),
  'moto não serve', 'detalhe sai sem espacos nas pontas');

-- 15-16) Leitura dos requisitos
set local role authenticated;
set local request.jwt.claims = '{"sub": "e3200000-0000-0000-0000-000000000001"}';

select is(
  (select count(*)::int from public.job_requirements
    where job_id = 'e3400000-0000-0000-0000-000000000001'),
  2, 'candidato le os requisitos da vaga ativa');

reset role;
set local role anon;

select throws_ok(
  $$select count(*) from public.job_requirements$$,
  '42501', NULL, 'anonimo nao le requisitos');

reset role;

-- 17-22) apply_to_job
set local role authenticated;
set local request.jwt.claims = '{"sub": "e3200000-0000-0000-0000-000000000001"}';

select throws_ok(
  $$select public.apply_to_job('e3400000-0000-0000-0000-000000000001')$$,
  'P0001', 'requirements_unanswered', 'sem responder os requisitos nao candidata');

select throws_ok(
  $$select public.apply_to_job('e3400000-0000-0000-0000-000000000001',
      '[{"requirement_id":"e3500000-0000-0000-0000-000000000001","meets":"sim"},
        {"requirement_id":"e3500000-0000-0000-0000-000000000002","meets":true}]'::jsonb)$$,
  '22023', 'invalid_answers', 'resposta que nao e sim/nao e recusada');

select throws_ok(
  $$select public.apply_to_job('e3400000-0000-0000-0000-000000000001',
      '[{"requirement_id":"e3500000-0000-0000-0000-000000000001","meets":true},
        {"requirement_id":"e3500000-0000-0000-0000-000000000009","meets":true}]'::jsonb)$$,
  'P0001', 'requirements_unanswered', 'resposta de requisito de outra vaga e recusada');

select is(
  public.apply_to_job('e3400000-0000-0000-0000-000000000001',
    '[{"requirement_id":"e3500000-0000-0000-0000-000000000001","meets":true},
      {"requirement_id":"e3500000-0000-0000-0000-000000000002","meets":true}]'::jsonb)
    - 'id' - 'job_id' - 'candidate_id' - 'match_score' - 'created_at',
  '{"created": true, "auto_rejected": false, "unmet_requirements": []}'::jsonb,
  'C1 atende tudo: candidatura criada');

select is(
  (select public.apply_to_job('e3400000-0000-0000-0000-000000000001',
    '[{"requirement_id":"e3500000-0000-0000-0000-000000000001","meets":true},
      {"requirement_id":"e3500000-0000-0000-0000-000000000002","meets":true}]'::jsonb) ->> 'created'),
  'false', 'candidatar de novo nao duplica');

select is(
  (select count(*)::int from public.feedback_deadlines fd
    join public.applications a on a.id = fd.application_id
    where a.candidate_id = 'e3200000-0000-0000-0000-000000000001' and fd.met_at is null),
  1, 'C1 tem prazo de retorno aberto');

-- 23-26) Recusa imediata por requisito excludente
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "e3200000-0000-0000-0000-000000000002"}';

select is(
  public.apply_to_job('e3400000-0000-0000-0000-000000000001',
    '[{"requirement_id":"e3500000-0000-0000-0000-000000000001","meets":false},
      {"requirement_id":"e3500000-0000-0000-0000-000000000002","meets":true}]'::jsonb)
    - 'id' - 'job_id' - 'candidate_id' - 'match_score' - 'created_at',
  '{"created": true, "auto_rejected": true, "unmet_requirements": ["CNH categoria B (moto não serve)"]}'::jsonb,
  'C2 nao atende o excludente: recusa imediata');

select is(
  (select current_stage::text from public.applications
    where candidate_id = 'e3200000-0000-0000-0000-000000000002'),
  'rejected', 'candidatura de C2 fica recusada');

select ok(
  (select reason_code = 'eliminatory' and kind = 'decision' and sent_to_candidate_at is not null
          and content like '%CNH categoria B (moto não serve)%'
     from public.feedbacks f
     join public.applications a on a.id = f.application_id
     where a.candidate_id = 'e3200000-0000-0000-0000-000000000002'),
  'C2 recebe o retorno com o requisito da vaga');

select is(
  (select count(*)::int from public.feedback_deadlines fd
    join public.applications a on a.id = fd.application_id
    where a.candidate_id = 'e3200000-0000-0000-0000-000000000002'),
  0, 'recusa imediata nao gera prazo (fora da meta e do selo)');

-- 27) Requisito nao excludente so registra
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "e3200000-0000-0000-0000-000000000003"}';

select is(
  (select public.apply_to_job('e3400000-0000-0000-0000-000000000001',
    '[{"requirement_id":"e3500000-0000-0000-0000-000000000001","meets":true},
      {"requirement_id":"e3500000-0000-0000-0000-000000000002","meets":false}]'::jsonb) ->> 'auto_rejected'),
  'false', 'C3 nao atende requisito nao excludente: segue no processo');

select is(
  (select count(*)::int from public.application_requirement_answers),
  2, 'C3 le so as proprias respostas');

select throws_ok(
  $$insert into public.application_requirement_answers (application_id, requirement_id, meets)
    select id, 'e3500000-0000-0000-0000-000000000002', true
    from public.applications where candidate_id = 'e3200000-0000-0000-0000-000000000003'$$,
  '42501', NULL, 'candidato nao grava resposta fora de apply_to_job');

-- 30-32) Recrutadores
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "e3100000-0000-0000-0000-000000000001"}';

select throws_ok(
  $$select public.apply_to_job('e3400000-0000-0000-0000-000000000001')$$,
  '42501', 'not_allowed', 'recrutador nao se candidata');

select is(
  (select count(*)::int from public.application_requirement_answers),
  6, 'R1 le as respostas das candidaturas da propria vaga');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "e3100000-0000-0000-0000-000000000002"}';

select is(
  (select count(*)::int from public.application_requirement_answers),
  0, 'R2 nao le respostas da vaga de R1');

select * from finish();
rollback;