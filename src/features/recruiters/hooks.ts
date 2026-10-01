import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRecruiterOnboarding, saveRecruiterOnboarding } from './api';
import { useAuth } from '../auth/hooks';

const recruiterOnboardingQueryKey = (userId: string | undefined) =>
  ['recruiter', userId, 'onboarding'] as const;

export function useRecruiterOnboarding() {
  const { user } = useAuth();
  return useQuery({
    queryKey: recruiterOnboardingQueryKey(user?.id),
    queryFn: getRecruiterOnboarding,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });
}

export function useSaveRecruiterOnboarding() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: saveRecruiterOnboarding,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: recruiterOnboardingQueryKey(user?.id),
      });
    },
  });
}
