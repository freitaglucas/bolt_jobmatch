import type { Job } from '../../lib/types';
import { normalizeText } from '../skills/search';
import { SENIORITY_VALUES, type SeniorityValue } from './seniority';

export type JobSortOrder = 'recent' | 'match';

export interface JobFilters {
  skillNames: string[];
  seniorities: SeniorityValue[];
  sort: JobSortOrder;
}

export const DEFAULT_JOB_FILTERS: JobFilters = {
  skillNames: [],
  seniorities: [],
  sort: 'recent',
};

export function hasActiveFilters(filters: JobFilters): boolean {
  return (
    filters.skillNames.length > 0 ||
    filters.seniorities.length > 0 ||
    filters.sort !== 'recent'
  );
}

// Lista as competências que aparecem nas vagas, sem repetir (ignora acento e
// maiúscula) e em ordem alfabética.
export function listJobSkillNames(jobs: Job[]): string[] {
  const byKey = new Map<string, string>();
  for (const job of jobs) {
    for (const skill of job.skills) {
      const key = normalizeText(skill.name);
      if (!byKey.has(key)) {
        byKey.set(key, skill.name);
      }
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// Lista as senioridades que aparecem nas vagas, na ordem oficial dos níveis.
export function listJobSeniorities(jobs: Job[]): SeniorityValue[] {
  const present = new Set<SeniorityValue>();
  for (const job of jobs) {
    if (job.seniority) {
      present.add(job.seniority);
    }
  }
  return SENIORITY_VALUES.filter((level) => present.has(level));
}

// Filtra e ordena. Dentro de cada filtro vale "qualquer um" (a vaga fica se tiver
// QUALQUER uma das competências escolhidas, ou QUALQUER uma das senioridades
// escolhidas). Entre os filtros vale "e". Com filtro de senioridade ligado, vagas
// sem senioridade ficam de fora.
// 'recent' mantém a ordem recebida (o banco já entrega da mais nova para a mais
// antiga). 'match' ordena pelo score, do maior para o menor; empate mantém a ordem.
export function applyJobFilters(
  jobs: Job[],
  filters: JobFilters,
  getScore: (job: Job) => number,
): Job[] {
  const wantedSkills = new Set(filters.skillNames.map(normalizeText));
  const wantedSeniorities = new Set<SeniorityValue>(filters.seniorities);

  const filtered =
    wantedSkills.size === 0 && wantedSeniorities.size === 0
      ? jobs
      : jobs.filter((job) => {
          if (
            wantedSkills.size > 0 &&
            !job.skills.some((skill) => wantedSkills.has(normalizeText(skill.name)))
          ) {
            return false;
          }
          if (
            wantedSeniorities.size > 0 &&
            !(job.seniority && wantedSeniorities.has(job.seniority))
          ) {
            return false;
          }
          return true;
        });

  if (filters.sort !== 'match') {
    return filtered;
  }

  return filtered
    .map((job, index) => ({ job, index, score: getScore(job) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.job);
}
