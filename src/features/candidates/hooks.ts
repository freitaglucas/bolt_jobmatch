import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyMatchSkills,
  getSkillCatalog,
  removeMyCandidateSkill,
  saveMyCandidateSkill,
} from './api';
import { useAuth } from '../auth/hooks';

const candidateSkillsQueryKey = (userId: string | undefined) =>
  ['candidate', userId, 'match-skills'] as const;

export function useMyMatchSkills() {
  const { user } = useAuth();
  return useQuery({
    queryKey: candidateSkillsQueryKey(user?.id),
    queryFn: getMyMatchSkills,
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
}

export function useSkillCatalog() {
  return useQuery({
    queryKey: ['skills', 'catalog'],
    queryFn: getSkillCatalog,
    staleTime: 5 * 60_000,
  });
}

export function useSaveCandidateSkill() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: saveMyCandidateSkill,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: candidateSkillsQueryKey(user?.id),
      }),
  });
}

export function useRemoveCandidateSkill() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: removeMyCandidateSkill,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: candidateSkillsQueryKey(user?.id),
      }),
  });
}
