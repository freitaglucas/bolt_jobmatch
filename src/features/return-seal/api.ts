import { supabase } from '../../shared/lib/supabase';
import type { SealRow } from './seal-rules';

// Selos das vagas pedidas, numa unica chamada. O banco so devolve linha para a
// vaga que conquistou o selo e so devolve o percentual.
export async function listReturnSeals(jobIds: readonly string[]): Promise<SealRow[]> {
  if (jobIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase.rpc('public_return_seals', {
    _job_ids: [...jobIds],
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as SealRow[];
}
