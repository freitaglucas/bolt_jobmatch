import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApplicationStatus } from '../../lib/types';
import { sendStageUpdate } from '../email/stage-update.api';
import { CANDIDATE_APPLICATIONS_QUERY_KEY } from './hooks';
import {
  listRecruiterApplications,
  moveApplicationStage,
  sendApplicationFeedback,
  type SendFeedbackInput,
} from './recruiter-applications.api';
import { shouldNotifyStageChange } from './stage-notice';

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
      // Etapa de origem: quando e a anterior no funil, o candidato recebe o aviso (N71).
      fromStage?: ApplicationStatus;
    }) => moveApplicationStage(applicationId, stage),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: RECRUITER_APPLICATIONS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: CANDIDATE_APPLICATIONS_QUERY_KEY,
      });
      if (shouldNotifyStageChange(variables.fromStage, variables.stage)) {
        // Aviso automatico por e-mail. Falha aqui nao desfaz a mudanca de etapa.
        void sendStageUpdate(variables.applicationId).catch(() => undefined);
      }
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
  });
}
