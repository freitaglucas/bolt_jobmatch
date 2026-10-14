-- N71: aviso automatico de mudanca de etapa ao candidato (gratis, sem texto livre).
-- A edge function send-email (template stage_update) registra o aviso em email_log,
-- ligado a candidatura e a etapa nova. Este indice garante que o mesmo aviso nunca
-- seja enviado duas vezes por e-mail para a mesma candidatura e etapa (reservado ou
-- enviado). Envio que falhou nao bloqueia nova tentativa.
--
-- TODO(N18): acrescentar org_id e a politica por empresa quando a empresa virar a
-- unidade de isolamento.

create unique index if not exists email_log_one_stage_update_per_stage_idx
  on public.email_log (application_id, stage)
  where template = 'stage_update'
    and status in ('pending', 'sent');
