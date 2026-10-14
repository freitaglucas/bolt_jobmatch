import { useQuery } from '@tanstack/react-query';
import { loadMatchInsights } from './match-insights.api';

// Lacunas e pontos fortes das candidaturas (so busca quando enabled).
export function useMatchInsights(applicationIds: readonly string[], enabled: boolean) {
  const key = [...applicationIds].sort().join(',');
  return useQuery({
    queryKey: ['applications', 'match-insights', key],
    queryFn: () => loadMatchInsights(applicationIds),
    enabled: enabled && applicationIds.length > 0,
    staleTime: 60_000,
  });
}
