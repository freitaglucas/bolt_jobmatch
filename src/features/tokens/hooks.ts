import { useQuery } from '@tanstack/react-query';
import { listTokenLedger } from './api';

export const TOKENS_QUERY_KEY = ['tokens'] as const;

export function useTokenLedger() {
  return useQuery({
    queryKey: [...TOKENS_QUERY_KEY, 'ledger'],
    queryFn: () => listTokenLedger(),
    staleTime: 30_000,
  });
}
