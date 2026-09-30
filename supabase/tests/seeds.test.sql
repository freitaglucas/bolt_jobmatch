-- pgTAP: verifica os seeds de skills (0.3) e do recrutador/vagas de teste (0.4)
--
-- Roda dentro do job `db-tests` do CI (.github/workflows/ci.yml). O passo
-- anterior `supabase db start` inicializa o banco local do zero, aplicando
-- as migrações e depois os seeds configurados em supabase/config.toml
-- ([db.seed].sql_paths); só então o passo `supabase test db` conecta nesse
-- banco já populado e executa os arquivos .sql de supabase/tests/. Ou seja,
-- quando este teste roda, os dados do seed já estão persistidos no banco —
-- não é necessário recriar fixtures manualmente para a maioria das
-- checagens abaixo.
--
-- A idempotência dos seeds é verificada pelo próprio job `db-tests` do CI
-- (.github/workflows/ci.yml): ele roda os dois arquivos de seed uma segunda
-- vez via `psql -f`, depois de `supabase db start` já ter aplicado migrações
-- + seeds uma primeira vez, e só então executa este arquivo de teste. Ou
-- seja, as contagens abaixo (exatamente 50 vagas, total de skills, nomes
-- sem duplicata) já refletem duas execuções do seed — se algum insert não
-- fosse idempotente, essas contagens estariam erradas/duplicadas aqui.

create extension if not exists pgtap with schema extensions;

begin;

select plan(9);

-- ---------------------------------------------------------------------
-- 0.3: skills
-- ---------------------------------------------------------------------

select ok(
  (select count(*) from public.skills) between 80 and 120,
  'total de skills esta entre 80 e 120'
);

select is(
  ((select count(*) from public.skills) - (select count(distinct name) from public.skills))::int,
  0,
  'nao ha nomes de skills duplicados'
);

-- ---------------------------------------------------------------------
-- 0.4: recrutador de teste e 50 vagas
-- ---------------------------------------------------------------------

select is(
  (select count(*)::int from public.jobs
     where recruiter_id = '5eed0000-0000-4000-8000-000000000001'),
  50,
  'existem exatamente 50 vagas do recrutador de teste (confirma idempotencia: CI ja rodou o seed 2x antes deste teste)'
);

select is(
  (select count(*)::int from public.jobs
     where recruiter_id = '5eed0000-0000-4000-8000-000000000001' and status = 'active'),
  50,
  'todas as vagas do recrutador de teste estao com status active'
);

select ok(
  (select bool_and(qty between 3 and 5) from (
    select js.job_id, count(*) as qty
    from public.job_skills js
    join public.jobs j on j.id = js.job_id
    where j.recruiter_id = '5eed0000-0000-4000-8000-000000000001'
    group by js.job_id
  ) counts),
  'toda vaga do recrutador de teste tem entre 3 e 5 job_skills'
);

select ok(
  (select bool_and(has_mandatory and has_optional) from (
    select js.job_id,
      bool_or(js.mandatory) as has_mandatory,
      bool_or(not js.mandatory) as has_optional
    from public.job_skills js
    join public.jobs j on j.id = js.job_id
    where j.recruiter_id = '5eed0000-0000-4000-8000-000000000001'
    group by js.job_id
  ) flags),
  'toda vaga do recrutador de teste tem pelo menos 1 job_skill obrigatoria e 1 opcional'
);

select ok(
  (select bool_and(
      case
        when j.title ~ 'J.nior' then js.required_level between 1 and 3
        when j.title ~ 'Pleno' then js.required_level between 2 and 4
        when j.title ~ 'S.nior' then js.required_level between 3 and 5
        else false
      end
    )
    from public.job_skills js
    join public.jobs j on j.id = js.job_id
    where j.recruiter_id = '5eed0000-0000-4000-8000-000000000001'
  ),
  'required_level de cada job_skill esta dentro da faixa esperada pela senioridade do titulo da vaga'
);

select ok(
  (select approved_at is not null
     from public.recruiter_profiles
     where user_id = '5eed0000-0000-4000-8000-000000000001'),
  'o recrutador de teste esta aprovado (approved_at preenchido)'
);

select ok(
  public.is_approved_recruiter('5eed0000-0000-4000-8000-000000000001'),
  'is_approved_recruiter retorna true para o recrutador de teste'
);

select * from finish();

rollback;
