-- pgTAP: paridade do Match Score (item N2; regua de 3 niveis desde o N30)
--
-- Roda dentro do job `db-tests` do CI via `supabase test db`.
--
-- Os MESMOS casos estao em src/features/match/lib/parityCases.ts e rodam na
-- versao em TypeScript (calculateMatch). O teste
-- src/features/match/lib/calculateMatch.parity.test.ts confere que este
-- arquivo tem os mesmos casos, dados e scores esperados. Se a formula mudar,
-- atualize os DOIS lados.
--
-- Cada caso monta uma vaga e um candidato de verdade (tudo dentro de uma
-- transacao que e desfeita no final) e chama
-- public.calculate_application_match_score(vaga, candidato).

create extension if not exists pgtap with schema extensions;

begin;

select plan(17);

-- ---------------------------------------------------------------------
-- Fixtures: 1 candidato, 1 recrutador e 3 competencias de teste
-- ---------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'a7000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'paridade.candidato@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"candidate","full_name":"Candidato Paridade"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c7000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'paridade.recrutador@test.local', 'x',
   now(), '{"provider":"email","providers":["email"]}',
   '{"role":"recruiter","full_name":"Recrutador Paridade"}', now(), now(), '', '', '', '');

insert into public.skills (name, category) values
  ('Paridade A', 'hard'),
  ('Paridade B', 'hard'),
  ('Paridade C', 'hard'),
  ('Paridade D', 'hard');

-- Grupos ja criados por caso (chave do JSON -> job_skill_groups.id).
create temp table parity_groups (job_id uuid, key text, group_id uuid);

-- Monta a vaga e as competencias do candidato a partir de dois JSON e devolve
-- o score calculado pelo banco.
--   p_job_skills:       [{"skill":"A","level":3,"weight":1,"mandatory":true}, ...]
--                       itens com "group" e "min" formam um grupo de alternativas (N33)
--   p_candidate_skills: [{"skill":"A","level":2,"evidenced":false}, ...]
create function pg_temp.parity_score(p_job_skills jsonb, p_candidate_skills jsonb)
returns numeric
language plpgsql
as $fn$
declare
  v_job_id uuid := gen_random_uuid();
  v_item jsonb;
  v_group_id uuid;
begin
  insert into public.jobs (id, recruiter_id, title, employment_type, status)
  values (v_job_id, 'c7000000-0000-0000-0000-000000000002', 'Vaga de paridade', 'CLT', 'draft');

  for v_item in select value from jsonb_array_elements(p_job_skills) loop
    v_group_id := null;
    if v_item ? 'group' then
      select pg.group_id into v_group_id
      from pg_temp.parity_groups pg
      where pg.job_id = v_job_id and pg.key = v_item->>'group';

      if v_group_id is null then
        insert into public.job_skill_groups (job_id, min_count, role)
        values (
          v_job_id,
          (v_item->>'min')::int,
          case when (v_item->>'mandatory')::boolean then 'required' else 'preferred' end
        )
        returning id into v_group_id;
        insert into pg_temp.parity_groups (job_id, key, group_id)
        values (v_job_id, v_item->>'group', v_group_id);
      end if;
    end if;

    insert into public.job_skills (job_id, skill_id, required_level, weight, mandatory, group_id)
    select v_job_id, s.id, (v_item->>'level')::int, (v_item->>'weight')::numeric,
           (v_item->>'mandatory')::boolean, v_group_id
    from public.skills s
    where s.name = 'Paridade ' || (v_item->>'skill');
  end loop;

  delete from public.candidate_skills
  where candidate_id = 'a7000000-0000-0000-0000-000000000001';

  for v_item in select value from jsonb_array_elements(p_candidate_skills) loop
    insert into public.candidate_skills (candidate_id, skill_id, declared_level, evidenced_by_project)
    select 'a7000000-0000-0000-0000-000000000001', s.id, (v_item->>'level')::int,
           (v_item->>'evidenced')::boolean
    from public.skills s
    where s.name = 'Paridade ' || (v_item->>'skill');
  end loop;

  return public.calculate_application_match_score(v_job_id, 'a7000000-0000-0000-0000-000000000001');
end
$fn$;

-- ---------------------------------------------------------------------
-- Casos
-- ---------------------------------------------------------------------

-- parity-case: same_weights expected=55.56
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":true},{"skill":"B","level":2,"weight":1,"mandatory":false},{"skill":"C","level":2,"weight":1,"mandatory":false}]'::jsonb,
    '[{"skill":"A","level":2,"evidenced":false},{"skill":"B","level":2,"evidenced":false}]'::jsonb
  ),
  55.56::numeric,
  'paridade: same_weights'
);

-- parity-case: importance_weights expected=62.96
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":true},{"skill":"B","level":2,"weight":0.75,"mandatory":false},{"skill":"C","level":2,"weight":0.5,"mandatory":false}]'::jsonb,
    '[{"skill":"A","level":2,"evidenced":false},{"skill":"B","level":2,"evidenced":false}]'::jsonb
  ),
  62.96::numeric,
  'paridade: importance_weights'
);

-- parity-case: mandatory_low_level expected=66.67
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":true},{"skill":"B","level":2,"weight":1,"mandatory":false}]'::jsonb,
    '[{"skill":"A","level":1,"evidenced":false},{"skill":"B","level":2,"evidenced":false}]'::jsonb
  ),
  66.67::numeric,
  'paridade: mandatory_low_level'
);

-- parity-case: mandatory_absent expected=25
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":true},{"skill":"B","level":2,"weight":1,"mandatory":false}]'::jsonb,
    '[{"skill":"B","level":2,"evidenced":false}]'::jsonb
  ),
  25::numeric,
  'paridade: mandatory_absent'
);

-- parity-case: evidence_bonus expected=76.67
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":false}]'::jsonb,
    '[{"skill":"A","level":2,"evidenced":true}]'::jsonb
  ),
  76.67::numeric,
  'paridade: evidence_bonus'
);

-- parity-case: evidence_cap expected=100
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":false}]'::jsonb,
    '[{"skill":"A","level":3,"evidenced":true}]'::jsonb
  ),
  100::numeric,
  'paridade: evidence_cap'
);

-- parity-case: level_above_required expected=100
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":2,"weight":1,"mandatory":false}]'::jsonb,
    '[{"skill":"A","level":3,"evidenced":false}]'::jsonb
  ),
  100::numeric,
  'paridade: level_above_required'
);

-- parity-case: one_third expected=33.33
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":false}]'::jsonb,
    '[{"skill":"A","level":1,"evidenced":false}]'::jsonb
  ),
  33.33::numeric,
  'paridade: one_third'
);

-- parity-case: zero_weights expected=0
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":2,"weight":0,"mandatory":false}]'::jsonb,
    '[{"skill":"A","level":3,"evidenced":false}]'::jsonb
  ),
  0::numeric,
  'paridade: zero_weights'
);

-- parity-case: job_without_skills expected=0
select is(
  pg_temp.parity_score(
    '[]'::jsonb,
    '[{"skill":"A","level":2,"evidenced":false}]'::jsonb
  ),
  0::numeric,
  'paridade: job_without_skills'
);

-- parity-case: mixed_evidence_weights expected=67.78
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":true},{"skill":"B","level":2,"weight":0.5,"mandatory":false}]'::jsonb,
    '[{"skill":"A","level":2,"evidenced":true},{"skill":"B","level":1,"evidenced":false}]'::jsonb
  ),
  67.78::numeric,
  'paridade: mixed_evidence_weights'
);

-- parity-case: group_one_of_met expected=75
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":2,"weight":1,"mandatory":true,"group":"g1","min":1},{"skill":"B","level":2,"weight":1,"mandatory":true,"group":"g1","min":1},{"skill":"C","level":2,"weight":1,"mandatory":true,"group":"g1","min":1},{"skill":"D","level":2,"weight":1,"mandatory":false}]'::jsonb,
    '[{"skill":"B","level":2,"evidenced":false},{"skill":"D","level":1,"evidenced":false}]'::jsonb
  ),
  75::numeric,
  'paridade: group_one_of_met'
);

-- parity-case: group_one_of_missing expected=25
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":2,"weight":1,"mandatory":true,"group":"g1","min":1},{"skill":"B","level":2,"weight":1,"mandatory":true,"group":"g1","min":1},{"skill":"C","level":2,"weight":1,"mandatory":true,"group":"g1","min":1},{"skill":"D","level":2,"weight":1,"mandatory":false}]'::jsonb,
    '[{"skill":"D","level":2,"evidenced":false}]'::jsonb
  ),
  25::numeric,
  'paridade: group_one_of_missing'
);

-- parity-case: group_two_of_four expected=83.33
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":true,"group":"g1","min":2},{"skill":"B","level":3,"weight":1,"mandatory":true,"group":"g1","min":2},{"skill":"C","level":3,"weight":1,"mandatory":true,"group":"g1","min":2},{"skill":"D","level":3,"weight":1,"mandatory":true,"group":"g1","min":2}]'::jsonb,
    '[{"skill":"A","level":3,"evidenced":false},{"skill":"B","level":2,"evidenced":false},{"skill":"C","level":1,"evidenced":false}]'::jsonb
  ),
  83.33::numeric,
  'paridade: group_two_of_four'
);

-- parity-case: group_two_of_four_short expected=25
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":true,"group":"g1","min":2},{"skill":"B","level":3,"weight":1,"mandatory":true,"group":"g1","min":2},{"skill":"C","level":3,"weight":1,"mandatory":true,"group":"g1","min":2},{"skill":"D","level":3,"weight":1,"mandatory":true,"group":"g1","min":2}]'::jsonb,
    '[{"skill":"A","level":3,"evidenced":false}]'::jsonb
  ),
  25::numeric,
  'paridade: group_two_of_four_short'
);

-- parity-case: group_preferred_with_evidence expected=88.33
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":3,"weight":1,"mandatory":false,"group":"g1","min":1},{"skill":"B","level":3,"weight":1,"mandatory":false,"group":"g1","min":1},{"skill":"C","level":2,"weight":1,"mandatory":true}]'::jsonb,
    '[{"skill":"A","level":2,"evidenced":true},{"skill":"C","level":2,"evidenced":false}]'::jsonb
  ),
  88.33::numeric,
  'paridade: group_preferred_with_evidence'
);

-- parity-case: group_min_above_size expected=100
select is(
  pg_temp.parity_score(
    '[{"skill":"A","level":2,"weight":1,"mandatory":true,"group":"g1","min":3},{"skill":"B","level":2,"weight":1,"mandatory":true,"group":"g1","min":3}]'::jsonb,
    '[{"skill":"A","level":2,"evidenced":false},{"skill":"B","level":2,"evidenced":false}]'::jsonb
  ),
  100::numeric,
  'paridade: group_min_above_size'
);

select * from finish();

rollback;