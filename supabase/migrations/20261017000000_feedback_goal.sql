-- N16: atingimento da meta de retorno no prazo (decisao de 08/10/2026).
--
-- A meta (90% dos retornos no prazo) e o desconto que ela garante (10%, simulado
-- no beta) ficam em funcoes, como as outras constantes da regra. A tela espelha
-- os mesmos valores em src/features/feedback-goal/goal-rules.ts.
--
-- Retorno no prazo = met_at <= due_at em feedback_deadlines (N63). Um prazo entra
-- na conta do periodo pela data em que foi resolvido: coalesce(met_at, due_at).
-- Assim um retorno dado no 1o dia ja conta, e um prazo aberto so conta depois de
-- vencido (prazo aberto ainda dentro do prazo fica de fora).
--
-- Tambem encerra o credito de +1 token por feedback no prazo (item 5.3): o
-- cashback em token foi substituido pela meta. O ledger e o saldo ficam como
-- historico; so deixa de entrar credito novo.
--
-- TODO(N18): trocar o recrutador pela empresa como unidade do indice.

create or replace function public.feedback_goal_target()
returns numeric
language sql
immutable
set search_path = ''
as $$
  select 0.90::numeric;
$$;

create or replace function public.feedback_goal_discount()
returns numeric
language sql
immutable
set search_path = ''
as $$
  select 0.10::numeric;
$$;

revoke all on function public.feedback_goal_target() from public, anon;
grant execute on function public.feedback_goal_target() to authenticated;
revoke all on function public.feedback_goal_discount() from public, anon;
grant execute on function public.feedback_goal_discount() to authenticated;

-- Uma linha por vaga do recrutador logado, com o total de prazos do periodo e
-- quantos foram cumpridos no prazo. SECURITY INVOKER: o RLS de jobs, candidaturas
-- e feedback_deadlines ja limita tudo as vagas do proprio recrutador.
create or replace function public.feedback_goal_attainment(
  _since timestamptz default date_trunc('month', now())
)
returns table (job_id uuid, total integer, on_time integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    j.id as job_id,
    count(*)::integer as total,
    (count(*) filter (where d.met_at is not null and d.met_at <= d.due_at))::integer
      as on_time
  from public.jobs j
  join public.applications a on a.job_id = j.id
  join public.feedback_deadlines d on d.application_id = a.id
  where j.recruiter_id = (select auth.uid())
    and public.is_approved_recruiter((select auth.uid()))
    and coalesce(d.met_at, d.due_at) >= _since
    and coalesce(d.met_at, d.due_at) <= now()
  group by j.id;
$$;

revoke all on function public.feedback_goal_attainment(timestamptz) from public, anon;
grant execute on function public.feedback_goal_attainment(timestamptz) to authenticated;

-- Fim do credito de token por feedback (substituido pela meta acima).
drop trigger if exists feedbacks_credit_tokens on public.feedbacks;
drop function if exists public.credit_token_for_timely_feedback();
