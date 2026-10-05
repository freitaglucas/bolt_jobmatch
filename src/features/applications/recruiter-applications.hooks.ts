import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApplicationStatus } from '../../lib/types';
import { TOKENS_QUERY_KEY } from '../tokens/hooks';
import { CANDIDATE_APPLICATIONS_QUERY_KEY } from './hooks';
import {
  listRecruiterApplications,
  moveApplicationStage,
  sendApplicationFeedback,
  type SendFeedbackInput,
} from './recruiter-applications.api';

export const RECRUITER_APPLICATIONS_QUERY_KEY = ['applications', 'recruiter'] as const;

export function useRecruiterApplications() {
  return useQuery({
    queryKey: RECRUITER_APPLICATIONS_QUERY_KEY,
    queryFn: listRecruiterApplications,
    staleTime: 30_000,
  });
}

// Move a candidatura para outra etapa. A chamada ao banco fica no api da
// feature; o RLS limita as vagas do recrutador.
export function useMoveApplicationStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      stage,
    }: {
      applicationId: string;
      stage: ApplicationStatus;
    }) => moveApplicationStage(applicationId, stage),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RECRUITER_APPLICATIONS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: CANDIDATE_APPLICATIONS_QUERY_KEY,
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TOKENS_QUERY_KEY });
    },
  });
}

// Envia o feedback ao candidato. Invalida as listas do recrutador e do
// candidato (o feedback aparece em "Minhas candidaturas").
export function useSendApplicationFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendFeedbackInput) => sendApplicationFeedback(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RECRUITER_APPLICATIONS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: CANDIDATE_APPLICATIONS_QUERY_KEY,
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TOKENS_QUERY_KEY });
    },
  });
}
