import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { acceptTcleConsent, hasTcleConsent } from './api';

const tcleConsentQueryKey = (userId: string) => ['consents', 'tcle', userId] as const;

export function useTcleConsent(userId: string | null) {
  const queryClient = useQueryClient();

  const consentQuery = useQuery({
    queryKey: tcleConsentQueryKey(userId ?? ''),
    queryFn: () => hasTcleConsent(userId ?? ''),
    enabled: userId !== null,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptTcleConsent,
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: tcleConsentQueryKey(userId),
        });
      }
    },
  });

  return {
    hasConsented: consentQuery.data ?? false,
    isLoading: consentQuery.isLoading,
    error: consentQuery.error,
    accept: acceptMutation.mutateAsync,
    acceptError: acceptMutation.error,
    isAccepting: acceptMutation.isPending,
  };
}
