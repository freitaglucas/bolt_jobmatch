-- N15a: retorno em lote ao candidato por e-mail (grátis, sem token).
-- A edge function send-email registra cada envio do lote em email_log, ligado
-- a candidatura e etapa, e usa um indice unico para nunca repetir a mesma
-- decisao por e-mail na mesma candidatura e etapa.
--
-- TODO(N18): acrescentar org_id e a politica por empresa quando a empresa virar a
-- unidade de isolamento.

alter table public.email_log
  add column if not exists application_id uuid references public.applications (id) on delete set null,
  add column if not exists stage public.application_status,
  add column if not exists feedback_kind text;

-- 'pending' = envio reservado pela edge function antes de chamar o provedor
-- (evita duplicar em chamadas simultaneas).
alter table public.email_log drop constraint if exists email_log_status_check;
alter table public.email_log
  add constraint email_log_status_check check (status in ('pending', 'sent', 'failed'));

alter table public.email_log drop constraint if exists email_log_feedback_kind_check;
alter table public.email_log
  add constraint email_log_feedback_kind_check
  check (feedback_kind is null or feedback_kind in ('decision', 'update'));

-- Uma decisao por e-mail por candidatura+etapa (reservada ou enviada). Envio que
-- falhou nao bloqueia nova tentativa. Atualizacoes honestas nao entram: o limite
-- delas e o de adiamentos (postpone_feedback).
create unique index if not exists email_log_one_decision_per_stage_idx
  on public.email_log (application_id, stage)
  where template = 'batch_feedback'
    and feedback_kind = 'decision'
    and status in ('pending', 'sent');

create index if not exists email_log_application_idx
  on public.email_log (application_id) where application_id is not null;

-- O e-mail do candidato vive so em auth.users e o recrutador nao o recebe: a
-- coluna to_email deixa de ser legivel por authenticated (a edge function usa a
-- chave de servico).
revoke select on public.email_log from authenticated;
grant select (
  id, recruiter_id, template, status, provider_id, error, created_at,
  application_id, stage, feedback_kind
) on public.email_log to authenticated;
