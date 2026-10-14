-- N64: encerrar a vaga so sem candidatos pendentes.
--
-- Pendente = candidatura ainda em etapa ativa (Em analise, Triagem, Entrevista ou
-- Final). Aprovado, Rejeitado e Desistiu nao seguram a vaga. A regra fica no banco:
-- quem tenta fechar (pela tela ou direto na API) com pendentes recebe o erro
-- job_has_pending_candidates (P0001). A tela oferece o retorno final em um clique
-- (motivo "vaga encerrada") antes de fechar.
--
-- TODO(N18): revisar quando a empresa virar a unidade de isolamento.

create or replace function public.enforce_job_close_rule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'closed' and old.status is distinct from 'closed' then
    if exists (
      select 1
      from public.applications a
      where a.job_id = new.id
        and public.is_feedback_deadline_stage(a.current_stage)
    ) then
      raise exception 'job_has_pending_candidates' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_job_close_rule() from public, anon, authenticated;

drop trigger if exists jobs_enforce_close_rule on public.jobs;
create trigger jobs_enforce_close_rule
  before update of status on public.jobs
  for each row execute function public.enforce_job_close_rule();
