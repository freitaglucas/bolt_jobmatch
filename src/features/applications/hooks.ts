import { useQuery } from '@tanstack/react-query';
import { listCandidateApplications } from './api';

// Chave das candidaturas do candidato ("Minhas candidaturas"). Tambem usada
// para invalidar a lista quando o recrutador registra um feedback.
export const CANDIDATE_APPLICATIONS_QUERY_KEY = ['applications', 'candidate'] as const;

// A policy "Candidates read own applications" limita as linhas as candidaturas
// do proprio candidato autenticado.
export function useCandidateApplications() {
  return useQuery({
    queryKey: CANDIDATE_APPLICATIONS_QUERY_KEY,
    queryFn: listCandidateApplications,
    staleTime: 30_000,
  });
}

