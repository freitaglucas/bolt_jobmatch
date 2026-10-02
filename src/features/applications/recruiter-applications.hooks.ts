import { useQuery } from '@tanstack/react-query';
import { listRecruiterApplications } from './recruiter-applications.api';

export const RECRUITER_APPLICATIONS_QUERY_KEY = ['applications', 'recruiter'] as const;

export function useRecruiterApplications() {
  return useQuery({
    queryKey: RECRUITER_APPLICATIONS_QUERY_KEY,
    queryFn: listRecruiterApplications,
    staleTime: 30_000,
  });
}
