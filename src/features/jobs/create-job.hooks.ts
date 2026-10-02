import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJob } from './create-job';
import type { CreateJobInput } from './create-job.schema';

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateJobInput) => createJob(input),
    onSuccess: () => {
      // Atualiza as vagas ativas do swipe (queryKey ['jobs', 'active']).
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
