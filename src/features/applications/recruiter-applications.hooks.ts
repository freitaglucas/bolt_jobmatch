import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApplicationStatus } from '../../lib/types';
import { supabase } from '../../shared/lib/supabase';
import { listRecruiterApplications } from './recruiter-applications.api';
import { stageToDbStatus } from './recruiter-applications';

export const RECRUITER_APPLICATIONS_QUERY_KEY = ['applications', 'recruiter'] as const;

export function useRecruiterApplications() {
  return useQuery({
    queryKey: RECRUITER_APPLICATIONS_QUERY_KEY,
    queryFn: listRecruiterApplications,
    staleTime: 30_000,
  });
}

// Move a candidatura para outra etapa. A coluna liberada para update e
// current_stage (a mesma que o mapper le); o RLS limita as vagas do recrutador.
export function useMoveApplicationStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicationId,
      stage,
    }: {
      applicationId: string;
      stage: ApplicationStatus;
    }) => {
      const { error } = await supabase
        .from('applications')
        .update({ current_stage: stageToDbStatus(stage) })
        .eq('id', applicationId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RECRUITER_APPLICATIONS_QUERY_KEY,
      });
    },
  });
}
