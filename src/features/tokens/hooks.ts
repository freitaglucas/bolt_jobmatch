import { useQuery } from '@tanstack/react-query';
import { getTokenBalance, listTokenLedger } from './api';

export const TOKENS_QUERY_KEY = ['tokens'] as const;

export function useTokenBalance() {
  return useQuery({
    queryKey: [...TOKENS_QUERY_KEY, 'balance'],
    queryFn: getTokenBalance,
    staleTime: 30_000,
  });
}

export function useTokenLedger() {
  return useQuery({
    queryKey: [...TOKENS_QUERY_KEY, 'ledger'],
    queryFn: () => listTokenLedger(),
    staleTime: 30_000,
  });
}

