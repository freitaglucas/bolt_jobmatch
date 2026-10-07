-- N17: registro de e-mails transacionais enviados pela edge function send-email.
-- Quem escreve e a edge function (chave de servico); o recrutador so le os proprios.
-- TODO(N18): acrescentar org_id e a politica por empresa quando a empresa virar a
-- unidade de isolamento.

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.recruiter_profiles (user_id) on delete cascade,
  template text not null,
  to_email text not null,
  status text not null,
  provider_id text,
  error text,
  created_at timestamptz not null default now(),
  constraint email_log_status_check check (status in ('sent', 'failed'))
);

create index if not exists email_log_recruiter_created_idx
  on public.email_log (recruiter_id, created_at desc);

alter table public.email_log enable row level security;

revoke all on public.email_log from public, anon, authenticated;
grant select on public.email_log to authenticated;

drop policy if exists "Recruiters read own email log" on public.email_log;
create policy "Recruiters read own email log"
  on public.email_log for select to authenticated
  using (recruiter_id = (select auth.uid()));
