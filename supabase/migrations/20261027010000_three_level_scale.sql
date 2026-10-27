-- N30: regua de 3 niveis (1 basico, 2 intermediario, 3 avancado) para a vaga
-- e para o candidato. Nao existe nivel 4 ou 5.
-- Conversao dos dados atuais (escala antiga 1-5): 1-2 -> 1, 3 -> 2, 4-5 -> 3.
-- O bonus de projeto (x1,15) passa a ter teto 3. O resto da formula fica igual
-- ate a formula v2 (N32). Os scores ja gravados sao recalculados na regua nova.

alter table public.job_skills
  drop constraint if exists job_skills_required_level_check;
alter table public.candidate_skills
  drop constraint if exists candidate_skills_declared_level_check;

update public.job_skills
set required_level = case
  when required_level <= 2 then 1
  when required_level = 3 then 2
  else 3
end;

update public.candidate_skills
set declared_level = case
  when declared_level <= 2 then 1
  when declared_level = 3 then 2
  else 3
end;

alter table public.job_skills
  add constraint job_skills_required_level_check
  check (required_level between 1 and 3);
alter table public.candidate_skills
  add constraint candidate_skills_declared_level_check
  check (declared_level between 1 and 3);

comment on column public.job_skills.required_level is
  'Nivel exigido: 1 basico, 2 intermediario, 3 avancado (N30).';
comment on column public.candidate_skills.declared_level is
  'Nivel do candidato: 1 basico, 2 intermediario, 3 avancado (N30).';

create or replace function public.calculate_application_match_score(
  _job_id uuid,
  _candidate_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  with factors as (
    select
      js.weight,
      js.mandatory,
      js.required_level,
      coalesce(
        case
          when cs.evidenced_by_project
            then least(3::numeric, cs.declared_level * 1.15)
          else cs.declared_level::numeric
        end,
        0
      ) as candidate_level
    from public.job_skills js
    left join public.candidate_skills cs
      on cs.skill_id = js.skill_id
      and cs.candidate_id = _candidate_id
    where js.job_id = _job_id
  ),
  totals as (
    select
      coalesce(sum(weight * least(candidate_level / required_level, 1)), 0) as partial_sum,
      coalesce(sum(weight), 0) as weight_sum,
      coalesce(bool_or(mandatory and candidate_level = 0), false) as missing_mandatory
    from factors
  )
  select round(
    case
      when weight_sum = 0 then 0
      when missing_mandatory then (partial_sum / weight_sum) * 50
      else (partial_sum / weight_sum) * 100
    end,
    2
  )
  from totals;
$$;

-- Recalcula o score das candidaturas existentes na regua nova (so as que mudam).
update public.applications
set match_score = public.calculate_application_match_score(job_id, candidate_id)
where match_score is distinct from public.calculate_application_match_score(job_id, candidate_id);
