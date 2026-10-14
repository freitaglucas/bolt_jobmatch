import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendBatchFeedback } from '../email/batch-feedback.api';
import { CANDIDATE_APPLICATIONS_QUERY_KEY } from '../applications/hooks';
import type { BatchEntry } from '../applications/batch-feedback';
import { moveApplicationStage } from '../applications/recruiter-applications.api';
import { RECRUITER_APPLICATIONS_QUERY_KEY } from '../applications/recruiter-applications.hooks';
import { runCloseJob, type CloseJobResult } from './close-job';
import { setJobStatus } from './recruiter-jobs';

// Retorno final aos pendentes (se houver) e encerramento da vaga. Atualiza as
// listas de vagas e de candidaturas ao terminar.
export function useCloseJob(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    CloseJobResult,
    Error,
    { entries: BatchEntry[]; onProgress?: (done: number, total: number) => void }
  >({
    mutationFn: ({ entries, onProgress }) =>
      runCloseJob(
        {
          send: sendBatchFeedback,
          move: (applicationId, stage) => moveApplicationStage(applicationId, stage),
          close: () => setJobStatus(jobId, 'closed'),
        },
        entries,
        onProgress,
      ),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: RECRUITER_APPLICATIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CANDIDATE_APPLICATIONS_QUERY_KEY });
    },
  });
}
