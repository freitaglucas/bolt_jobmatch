-- pgTAP: verifica os seeds de skills (0.3) e do recrutador/vagas de teste (0.4)
--
-- Roda dentro do job `db-tests` do CI (.github/workflows/ci.yml), via
-- `supabase test db` (script npm "test:db"). Esse comando primeiro reseta o
-- banco local, aplicando as migrações e depois os seeds configurados em
-- supabase/config.toml ([db.seed].sql_paths), e só então executa os
-- arquivos .sql de supabase/tests/. Ou seja, quando este teste roda, os
-- dados do seed já estão persistidos no banco — não é necessário recriar
-- fixtures manualmente para a maioria das checagens abaixo.
--
-- A checagem de idempotência reexecuta os dois arquivos de seed via `\i`
-- (comando do psql, que resolve o caminho relativo ao diretório de onde o
-- processo foi iniciado — a raiz do repositório, que é onde o job db-tests
-- roda `supabase test db`) e confirma que as contagens não mudam.

create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

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
  'existem exatamente 50 vagas do recrutador de teste'
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

-- ---------------------------------------------------------------------
-- Idempotencia: reexecutar os seeds nao deve alterar as contagens
-- ---------------------------------------------------------------------

create temp table idempotency_before as
select
  (select count(*) from public.skills) as skills_count,
  (select count(*) from public.jobs
     where recruiter_id = '5eed0000-0000-4000-8000-000000000001') as jobs_count,
  (select count(*) from public.job_skills js
     join public.jobs j on j.id = js.job_id
     where j.recruiter_id = '5eed0000-0000-4000-8000-000000000001') as job_skills_count;

-- Caminho relativo ao diretorio deste proprio arquivo de teste
-- (supabase/tests/), pois o psql resolve \i relativo ao script em execucao,
-- nao ao diretorio de onde `supabase test db` foi chamado.
\i ../seeds/01_skills.sql
\i ../seeds/02_test_recruiter_and_jobs.sql

select is(
  (select count(*) from public.skills),
  (select skills_count from idempotency_before),
  'reexecutar o seed de skills nao muda o total de skills'
);

select is(
  (select count(*) from public.jobs
     where recruiter_id = '5eed0000-0000-4000-8000-000000000001'),
  (select jobs_count from idempotency_before),
  'reexecutar o seed de vagas nao muda o total de vagas do recrutador de teste'
);

select is(
  (select count(*) from public.job_skills js
     join public.jobs j on j.id = js.job_id
     where j.recruiter_id = '5eed0000-0000-4000-8000-000000000001'),
  (select job_skills_count from idempotency_before),
  'reexecutar o seed de vagas nao muda o total de job_skills do recrutador de teste'
);

select * from finish();

rollback;
