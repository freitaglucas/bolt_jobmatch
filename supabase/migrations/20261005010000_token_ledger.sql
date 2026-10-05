-- Fase 3a: extrato de tokens (ledger), debito ao mover etapa, credito por
-- feedback no prazo e paywall (saldo zero) aplicados no banco.

create table if not exists public.token_ledger (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.recruiter_profiles (user_id) on delete cascade,
  amount integer not null,
  kind text not null,
  application_id uuid references public.applications (id) on delete set null,
  stage public.application_status,
  created_at timestamptz not null default now(),
  constraint token_ledger_kind_check
    check (kind in ('initial_grant', 'stage_move_debit', 'feedback_credit')),
  constraint token_ledger_amount_check check (
    (kind = 'initial_grant' and amount > 0)
    or (kind = 'stage_move_debit' and amount < 0)
    or (kind = 'feedback_credit' and amount > 0)
  )
);

create index if not exists token_ledger_recruiter_created_idx
  on public.token_ledger (recruiter_id, created_at desc);

create unique index if not exists token_ledger_one_initial_grant_idx
  on public.token_ledger (recruiter_id) where kind = 'initial_grant';

create unique index if not exists token_ledger_one_feedback_credit_idx
  on public.token_ledger (application_id, stage) where kind = 'feedback_credit';

alter table public.token_ledger enable row level security;

revoke all on public.token_ledger from public, anon, authenticated;
grant select on public.token_ledger to authenticated;

drop policy if exists "Recruiters read own token ledger" on public.token_ledger;
create policy "Recruiters read own token ledger"
  on public.token_ledger for select to authenticated
  using (recruiter_id = (select auth.uid()));

-- Saldo = soma do extrato (derivado, sem coluna de saldo).
create or replace function public.my_token_balance()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(amount), 0)::integer
  from public.token_ledger
  where recruiter_id = (select auth.uid());
$$;

-- Prazo (SLA) para enviar feedback: 5 dias.
create or replace function public.feedback_sla()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '5 days';
$$;

revoke all on function public.my_token_balance() from public, anon;
grant execute on function public.my_token_balance() to authenticated;
revoke all on function public.feedback_sla() from public, anon;
grant execute on function public.feedback_sla() to authenticated;

-- 20 tokens iniciais na aprovacao do recrutador (idempotente).
create or replace function public.grant_initial_tokens()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.approved_at is not null then
    insert into public.token_ledger (recruiter_id, amount, kind)
    values (new.user_id, 20, 'initial_grant')
    on conflict (recruiter_id) where kind = 'initial_grant' do nothing;
  end if;
  return new;
end;
$$;

-- Backfill: recrutadores ja aprovados.
insert into public.token_ledger (recruiter_id, amount, kind)
select user_id, 20, 'initial_grant'
from public.recruiter_profiles
where approved_at is not null
on conflict (recruiter_id) where kind = 'initial_grant' do nothing;

-- Debito de 1 token ao mover etapa; bloqueia com saldo zero.
create or replace function public.charge_token_for_stage_move()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recruiter uuid;
  v_balance integer;
begin
  if new.current_stage is not distinct from old.current_stage then
    return new;
  end if;
  if new.current_stage in ('rejected', 'withdrawn') then
    return new;
  end if;
  if auth.uid() is null then
    return new;
  end if;

  select j.recruiter_id into v_recruiter
  from public.jobs j
  where j.id = new.job_id;

  if v_recruiter is null then
    return new;
  end if;

  perform 1
  from public.recruiter_profiles rp
  where rp.user_id = v_recruiter
  for update;

  select coalesce(sum(tl.amount), 0)::integer into v_balance
  from public.token_ledger tl
  where tl.recruiter_id = v_recruiter;

  if v_balance < 1 then
    raise exception 'insufficient_tokens'
      using errcode = 'P0001',
            hint = 'Envie feedback no prazo para ganhar tokens.';
  end if;

  insert into public.token_ledger (recruiter_id, amount, kind, application_id, stage)
  values (v_recruiter, -1, 'stage_move_debit', new.id, new.current_stage);

  return new;
end;
$$;

-- Credito de 1 token por feedback enviado dentro do SLA (1 por candidatura+etapa).
create or replace function public.credit_token_for_timely_feedback()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recruiter uuid;
  v_stage public.application_status;
  v_changed timestamptz;
begin
  if new.sent_to_candidate_at is null then
    return new;
  end if;

  select j.recruiter_id, a.current_stage, coalesce(a.last_stage_change_at, a.created_at)
    into v_recruiter, v_stage, v_changed
  from public.applications a
  join public.jobs j on j.id = a.job_id
  where a.id = new.application_id;

  if v_recruiter is null then
    return new;
  end if;
  if new.author_id is distinct from v_recruiter then
    return new;
  end if;
  if now() - v_changed > public.feedback_sla() then
    return new;
  end if;

  insert into public.token_ledger (recruiter_id, amount, kind, application_id, stage)
  values (v_recruiter, 1, 'feedback_credit', new.application_id, v_stage)
  on conflict (application_id, stage) where kind = 'feedback_credit' do nothing;

  return new;
end;
$$;

revoke all on function public.grant_initial_tokens() from public, anon, authenticated;
revoke all on function public.charge_token_for_stage_move() from public, anon, authenticated;
revoke all on function public.credit_token_for_timely_feedback() from public, anon, authenticated;

drop trigger if exists recruiter_profiles_grant_tokens on public.recruiter_profiles;
create trigger recruiter_profiles_grant_tokens
  after insert or update of approved_at on public.recruiter_profiles
  for each row execute function public.grant_initial_tokens();

drop trigger if exists applications_charge_tokens on public.applications;
create trigger applications_charge_tokens
  before update of current_stage on public.applications
  for each row execute function public.charge_token_for_stage_move();

drop trigger if exists feedbacks_credit_tokens on public.feedbacks;
create trigger feedbacks_credit_tokens
  after insert on public.feedbacks
  for each row execute function public.credit_token_for_timely_feedback();

-- Recrutador nao pode mais alterar last_stage_change_at (base do SLA).
revoke update on public.applications from authenticated;
grant update (current_stage, status, feedback_sent_at, silver_medalist)
  on public.applications to authenticated;
