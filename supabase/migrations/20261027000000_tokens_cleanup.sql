-- NOVO-7: limpeza dos restos de tokens (decisao de 08/10/2026: o token nao paga nada).
-- O recrutador aprovado deixa de ganhar 20 tokens e o saldo derivado sai do banco.
-- A tabela token_ledger fica como historico, so leitura para o proprio recrutador
-- (RLS e grants intactos). public.feedback_sla() continua: e a base do prazo.

drop trigger if exists recruiter_profiles_grant_tokens on public.recruiter_profiles;
drop function if exists public.grant_initial_tokens();
drop function if exists public.my_token_balance();

comment on table public.token_ledger is
  'Historico do extrato de tokens (regra encerrada em 08/10/2026). Nada novo e gravado.';
