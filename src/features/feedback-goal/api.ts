import { supabase } from '../../shared/lib/supabase';
import type { GoalRow } from './goal-rules';

// Prazos do recrutador logado desde "since", agrupados por vaga. O banco ja
// limita as linhas as vagas do proprio recrutador aprovado.
export async function listGoalAttainment(since: string): Promise<GoalRow[]> {
  const { data, error } = await supabase.rpc('feedback_goal_attainment', {
    _since: since,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as GoalRow[];
}
