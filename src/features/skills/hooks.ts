import { useQuery } from '@tanstack/react-query';
import { listSkills } from './api';

export function useSkillsCatalog() {
  return useQuery({
    queryKey: ['skills', 'catalog'],
    queryFn: listSkills,
    staleTime: 10 * 60_000,
  });
}
