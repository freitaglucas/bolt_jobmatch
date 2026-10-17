-- N65: selo publico de retorno no prazo (decisao de 08/10/2026).
--
-- Mostra, na vaga, "94% dos candidatos receberam retorno no prazo". So existe
-- quando a meta (feedback_goal_target(), 90%) esta atingida e ha pelo menos 30
-- prazos nos ultimos 90 dias. Nao existe selo negativo: sem selo, a funcao nao
-- devolve linha.
--
-- Mesma regra de prazo do N16 (retorno no prazo = met_at <= due_at; o prazo entra
-- pela data em que foi resolvido, coalesce(met_at, due_at)). O percentual e
-- arredondado para BAIXO. A funcao e SECURITY DEFINER para o candidato (e quem
-- ainda nao entrou) ler o selo sem acessar candidaturas, e devolve so o inteiro:
-- nunca totais, contagens, ids de recrutador ou de candidato.
--
-- TODO(N18): ate la o indice e do recrutador dono da vaga (todas as vagas dele
-- contam); depois passa a ser da empresa.

create or replace function public.return_seal_min_returns()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 30;
$$;

create or replace function public.return_seal_window_days()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 90;
$$;

revoke all on function public.return_seal_min_returns() from public, anon, authenticated;
revoke all on function public.return_seal_window_days() from public, anon, authenticated;

create or replace function public.public_return_seals(_job_ids uuid[])
returns table (job_id uuid, seal_percent integer)
language sql
stable
security definer
set search_path = ''
as $$
  with stats as (
    select
      j.id as job_id,
      count(*) as total,
      count(*) filter (where d.met_at is not null and d.met_at <= d.due_at) as on_time
    from public.jobs j
    join public.jobs rj on rj.recruiter_id = j.recruiter_id
    join public.applications a on a.job_id = rj.id
    join public.feedback_deadlines d on d.application_id = a.id
    where j.id = any (_job_ids[1:200])
      and j.status = 'active'
      and coalesce(d.met_at, d.due_at)
            >= now() - make_interval(days => public.return_seal_window_days())
      and coalesce(d.met_at, d.due_at) <= now()
    group by j.id
  )
  select
    s.job_id,
    floor(100.0 * s.on_time / s.total)::integer as seal_percent
  from stats s
  where s.total >= public.return_seal_min_returns()
    and s.on_time * 100 >= s.total * round(public.feedback_goal_target() * 100);
$$;

revoke all on function public.public_return_seals(uuid[]) from public, anon, authenticated;
grant execute on function public.public_return_seals(uuid[]) to anon, authenticated;
