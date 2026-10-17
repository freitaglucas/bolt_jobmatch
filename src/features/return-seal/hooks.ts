import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listReturnSeals } from './api';
import { sealsByJob } from './seal-rules';

const MAX_JOBS_PER_CALL = 200;
const EMPTY: Record<string, number> = {};

// Selo de retorno por vaga. Se a consulta falhar, nao mostra selo (nunca quebra
// o Swipe nem a vaga por causa dele).
export function useReturnSeals(jobIds: readonly string[]) {
  const ids = useMemo(
    () => [...new Set(jobIds)].sort().slice(0, MAX_JOBS_PER_CALL),
    [jobIds],
  );
  const key = ids.join(',');

  const query = useQuery({
    queryKey: ['return-seals', key],
    queryFn: () => listReturnSeals(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const byJob = useMemo(
    () => (query.data ? sealsByJob(query.data) : EMPTY),
    [query.data],
  );

  return { byJob };
}
