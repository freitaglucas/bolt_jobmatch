-- 2.2b: nivel de senioridade da vaga (opcional).
--
-- Guarda um codigo simples (sem acento e sem espaco). O nome bonito aparece
-- na tela (src/features/jobs/seniority.ts). A coluna aceita vazio: as vagas
-- que ja existem ficam sem senioridade. Pode rodar mais de uma vez.

alter table public.jobs add column if not exists seniority text;

alter table public.jobs drop constraint if exists jobs_seniority_check;
alter table public.jobs add constraint jobs_seniority_check
  check (
    seniority is null
    or seniority in (
      'junior',
      'pleno',
      'senior',
      'especialista',
      'coordenador',
      'gerente',
      'head',
      'diretor',
      'c_level'
    )
  );

comment on column public.jobs.seniority is
  'Nivel de senioridade da vaga (opcional): junior, pleno, senior, especialista, coordenador, gerente, head, diretor, c_level.';
