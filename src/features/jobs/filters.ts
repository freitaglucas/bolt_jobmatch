import type { Job } from '../../lib/types';
import { normalizeText } from '../skills/search';

export type JobSortOrder = 'recent' | 'match';

export interface JobFilters {
  skillNames: string[];
  sort: JobSortOrder;
}

export const DEFAULT_JOB_FILTERS: JobFilters = {
  skillNames: [],
  sort: 'recent',
};

export function hasActiveFilters(filters: JobFilters): boolean {
  return filters.skillNames.length > 0 || filters.sort !== 'recent';
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

// Filtra por competência (a vaga fica se tiver QUALQUER uma das escolhidas) e
// ordena. 'recent' mantém a ordem recebida (o banco já entrega da mais nova
// para a mais antiga). 'match' ordena pelo score, do maior para o menor; em
// caso de empate, mantém a ordem recebida.
export function applyJobFilters(
  jobs: Job[],
  filters: JobFilters,
  getScore: (job: Job) => number,
): Job[] {
  const wanted = new Set(filters.skillNames.map(normalizeText));
  const filtered =
    wanted.size === 0
      ? jobs
      : jobs.filter((job) =>
          job.skills.some((skill) => wanted.has(normalizeText(skill.name))),
        );

  if (filters.sort !== 'match') {
    return filtered;
  }

  return filtered
    .map((job, index) => ({ job, index, score: getScore(job) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.job);
}
