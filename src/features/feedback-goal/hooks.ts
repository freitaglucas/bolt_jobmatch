import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/hooks';
import { listGoalAttainment } from './api';
import { monthStartIso } from './goal-rules';

export const FEEDBACK_GOAL_QUERY_KEY = ['feedback-goal'] as const;

// Meta do mes corrente. staleTime 0: o numero muda a cada retorno dado e a
// consulta e leve, entao a tela sempre confere ao abrir.
export function useGoalAttainment() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...FEEDBACK_GOAL_QUERY_KEY, user?.id],
    queryFn: () => listGoalAttainment(monthStartIso(new Date())),
    enabled: Boolean(user?.id),
    staleTime: 0,
  });
}
