import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/hooks';
import {
  deleteJob,
  listRecruiterJobs,
  setJobStatus,
  type JobStatusValue,
} from './recruiter-jobs';

export function useRecruiterJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['jobs', 'recruiter', user?.id],
    queryFn: listRecruiterJobs,
    enabled: Boolean(user?.id),
  });
}

export function useSetJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: JobStatusValue }) =>
      setJobStatus(jobId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => deleteJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
