import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyCandidateProfile,
  getMyMatchSkills,
  getSkillCatalog,
  removeMyCandidateSkill,
  saveMyCandidateProfile,
  saveMyCandidateSkill,
} from './api';
import { useAuth } from '../auth/hooks';

const candidateSkillsQueryKey = (userId: string | undefined) =>
  ['candidate', userId, 'match-skills'] as const;

const candidateProfileQueryKey = (userId: string | undefined) =>
  ['candidate', userId, 'profile'] as const;

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

export function useMyCandidateProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: candidateProfileQueryKey(user?.id),
    queryFn: getMyCandidateProfile,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });
}

export function useSaveCandidateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: saveMyCandidateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: candidateProfileQueryKey(user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: candidateSkillsQueryKey(user?.id),
      });
    },
  });
}
