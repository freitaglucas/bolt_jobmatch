import { useQuery } from '@tanstack/react-query';
import { listRequirementOptions, listSkills } from './api';

export function useSkillsCatalog() {
  return useQuery({
    queryKey: ['skills', 'catalog'],
    queryFn: listSkills,
    staleTime: 10 * 60_000,
  });
}

export function useRequirementOptions() {
  return useQuery({
    queryKey: ['skills', 'requirements'],
    queryFn: listRequirementOptions,
    staleTime: 10 * 60_000,
  });
}
