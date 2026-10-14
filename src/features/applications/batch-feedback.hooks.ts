import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendBatchFeedback } from '../email/batch-feedback.api';
import { CANDIDATE_APPLICATIONS_QUERY_KEY } from './hooks';
import {
  runBatchFeedback,
  type BatchEntry,
  type BatchOutcome,
} from './batch-feedback';
import { RECRUITER_APPLICATIONS_QUERY_KEY } from './recruiter-applications.hooks';
import { moveApplicationStage } from './recruiter-applications.api';

// Envia o retorno em lote (e muda a etapa no "avancou"). Atualiza as listas do
// recrutador e do candidato ao terminar.
export function useGiveBatchFeedback() {
  const queryClient = useQueryClient();
  return useMutation<
    BatchOutcome[],
    Error,
    { entries: BatchEntry[]; onProgress?: (done: number, total: number) => void }
  >({
    mutationFn: ({ entries, onProgress }) =>
      runBatchFeedback(
        {
          send: sendBatchFeedback,
          move: (applicationId, stage) => moveApplicationStage(applicationId, stage),
        },
        entries,
        onProgress,
      ),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RECRUITER_APPLICATIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CANDIDATE_APPLICATIONS_QUERY_KEY });
    },
  });
}
