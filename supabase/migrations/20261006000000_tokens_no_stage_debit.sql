-- N14: mover etapa e todo trabalho manual sao gratis (decisao de 06/10/2026).
-- Remove o debito de token ao mover etapa e o bloqueio por saldo zero (paywall).
-- O ledger, o saldo, os 20 tokens iniciais e o credito por feedback no prazo
-- continuam. Linhas 'stage_move_debit' antigas ficam no extrato como historico
-- (a constraint de kind nao muda).

drop trigger if exists applications_charge_tokens on public.applications;
drop function if exists public.charge_token_for_stage_move();
