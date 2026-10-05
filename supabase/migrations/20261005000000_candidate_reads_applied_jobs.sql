-- O candidato so le vagas e empresas ativas. Ao pausar ou fechar a vaga, a
-- candidatura perdia titulo e empresa em "Minhas candidaturas". As funcoes sao
-- security definer para nao gerar recursao de RLS entre jobs e applications
-- (a policy de leitura do recrutador em applications consulta jobs).

create or replace function public.has_applied_to_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    where a.job_id = p_job_id
      and a.candidate_id = (select auth.uid())
  );
$$;

create or replace function public.has_applied_to_company(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where j.company_id = p_company_id
      and a.candidate_id = (select auth.uid())
  );
$$;

revoke all on function public.has_applied_to_job(uuid) from public;
revoke all on function public.has_applied_to_company(uuid) from public;
grant execute on function public.has_applied_to_job(uuid) to authenticated;
grant execute on function public.has_applied_to_company(uuid) to authenticated;

create policy "Candidates read jobs they applied to"
  on public.jobs for select to authenticated
  using (public.has_applied_to_job(id));

create policy "Candidates read companies of jobs they applied to"
  on public.companies for select to authenticated
  using (public.has_applied_to_company(id));
