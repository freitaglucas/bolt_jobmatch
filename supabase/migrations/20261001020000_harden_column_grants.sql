-- Correção de permissões (descoberta pelo teste recruiter_onboarding.test.sql)
--
-- No Supabase, o papel authenticated recebe por padrão todos os privilégios
-- nas tabelas do schema public. A migração inicial concedeu privilégios por
-- coluna em recruiter_profiles e applications, mas não revogou o privilégio
-- de tabela de authenticated; por isso os limites por coluna não valiam
-- (ex.: o recrutador conseguia alterar o próprio approved_at).
--
-- REVOKE no nível da tabela também remove os grants por coluna, por isso eles
-- são concedidos de novo logo em seguida. Pode rodar mais de uma vez.

revoke insert, update on public.recruiter_profiles from authenticated;
grant insert (user_id, company_id, position, phone) on public.recruiter_profiles to authenticated;
grant update (company_id, position, phone) on public.recruiter_profiles to authenticated;

revoke insert, update on public.applications from authenticated;
grant insert (job_id, candidate_id) on public.applications to authenticated;
grant update (current_stage, status, last_stage_change_at, feedback_sent_at, silver_medalist)
  on public.applications to authenticated;