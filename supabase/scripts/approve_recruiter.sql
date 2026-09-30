-- ============================================================================
--  ATENÇÃO — TROQUE O E-MAIL ABAIXO ANTES DE RODAR ESTE SCRIPT!
--
--  Este script aprova um recrutador manualmente, marcando
--  recruiter_profiles.approved_at = now(). Ele NÃO roda automaticamente
--  (não faz parte do supabase/seeds/). Use-o pelo SQL Editor do painel do
--  Supabase quando quiser aprovar a conta de um recrutador real.
--
--  Troque 'recrutador@exemplo.com' pelo e-mail da conta que você quer
--  aprovar antes de executar. Depois de rodar, confira o resultado com o
--  SELECT no final do arquivo.
-- ============================================================================

update public.recruiter_profiles rp
set approved_at = coalesce(rp.approved_at, now())
from auth.users u
where rp.user_id = u.id
  and u.email = 'recrutador@exemplo.com'; -- <<< TROQUE AQUI O E-MAIL

-- Confira se a aprovação foi aplicada:
select u.email, rp.approved_at
from public.recruiter_profiles rp
join auth.users u on u.id = rp.user_id
where u.email = 'recrutador@exemplo.com'; -- <<< TROQUE AQUI TAMBÉM
