import { supabase } from '../../shared/lib/supabase';
import type { TokenLedgerRow } from './token-rules';

// Extrato do recrutador logado, do mais recente para o mais antigo. O RLS
// ja limita as linhas ao proprio recrutador.
export async function listTokenLedger(limit = 100): Promise<TokenLedgerRow[]> {
  const { data, error } = await supabase
    .from('token_ledger')
    .select('id, amount, kind, application_id, stage, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as TokenLedgerRow[];
}
