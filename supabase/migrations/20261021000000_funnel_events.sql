-- N84: eventos do funil do candidato (base do teste D6).
-- A pagina da vaga nao abre para anonimo (jobs so e lido por authenticated), entao o
-- funil comeca no cadastro: comecou o perfil -> completou o perfil -> abriu a vaga ->
-- candidatou-se. A origem (link da vaga "?vaga=<id>") vai no metadata de cada evento.
-- Nenhum dado de pessoa novo: event_log continua com RLS "so os proprios eventos".

alter table public.event_log drop constraint event_log_event_type_check;

alter table public.event_log add constraint event_log_event_type_check check (
  event_type in (
    'score_seen',
    'swipe_decision',
    'application_submitted',
    'job_viewed',
    'profile_started',
    'profile_completed'
  )
);

-- Marcos que contam uma vez por pessoa. O app ignora a repeticao (erro 23505).
create unique index event_log_funnel_once_idx
  on public.event_log (user_id, event_type)
  where event_type in ('profile_started', 'profile_completed');
