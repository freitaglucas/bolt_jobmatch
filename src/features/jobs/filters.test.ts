import { describe, expect, it } from 'vitest';
import type { Job } from '../../lib/types';
import {
  applyJobFilters,
  DEFAULT_JOB_FILTERS,
  hasActiveFilters,
  listJobSkillNames,
} from './filters';

function makeJob(id: string, skillNames: string[]): Job {
  return {
    id,
    title: `Vaga ${id}`,
    company: 'Empresa',
    location: 'Remoto',
    salary: 'A combinar',
    type: 'CLT',
    description: '',
    matchScore: 0,
    skills: skillNames.map((name) => ({
      name,
      level: 3,
      candidateLevel: 0,
      mandatory: false,
      weight: 1,
    })),
    posted: '',
    tags: skillNames,
    status: 'Ativa',
    candidatesCount: 0,
    newCandidatesCount: 0,
    interviewCount: 0,
  };
}

const JOBS: Job[] = [
  makeJob('a', ['SQL', 'Python']),
  makeJob('b', ['Comunicação']),
  makeJob('c', ['Python', 'Liderança']),
];

const SCORES: Record<string, number> = { a: 50, b: 90, c: 50 };
const getScore = (job: Job) => SCORES[job.id] ?? 0;

describe('applyJobFilters', () => {
  it('returns all jobs in the same order by default', () => {
    const result = applyJobFilters(JOBS, DEFAULT_JOB_FILTERS, getScore);
    expect(result.map((job) => job.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps jobs that have any of the chosen skills', () => {
    const result = applyJobFilters(
      JOBS,
      { skillNames: ['Python', 'Comunicação'], sort: 'recent' },
      getScore,
    );
    expect(result.map((job) => job.id)).toEqual(['a', 'b', 'c']);
  });

  it('ignores accents and case when filtering', () => {
    const result = applyJobFilters(
      JOBS,
      { skillNames: ['comunicacao'], sort: 'recent' },
      getScore,
    );
    expect(result.map((job) => job.id)).toEqual(['b']);
  });

  it('returns nothing when no job has the skill', () => {
    const result = applyJobFilters(
      JOBS,
      { skillNames: ['Excel'], sort: 'recent' },
      getScore,
    );
    expect(result).toEqual([]);
  });

  it('sorts by match score, highest first, keeping the order on ties', () => {
    const result = applyJobFilters(
      JOBS,
      { skillNames: [], sort: 'match' },
      getScore,
    );
    expect(result.map((job) => job.id)).toEqual(['b', 'a', 'c']);
  });

  it('does not change the original list', () => {
    applyJobFilters(JOBS, { skillNames: [], sort: 'match' }, getScore);
    expect(JOBS.map((job) => job.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('listJobSkillNames', () => {
  it('lists each skill once, sorted', () => {
    expect(listJobSkillNames(JOBS)).toEqual([
      'Comunicação',
      'Liderança',
      'Python',
      'SQL',
    ]);
  });

  it('does not repeat skills that differ only by accent or case', () => {
    const jobs = [makeJob('x', ['Comunicação']), makeJob('y', ['comunicacao'])];
    expect(listJobSkillNames(jobs)).toEqual(['Comunicação']);
  });
});

describe('hasActiveFilters', () => {
  it('is false for the default filters', () => {
    expect(hasActiveFilters(DEFAULT_JOB_FILTERS)).toBe(false);
  });

  it('is true when a skill is chosen or the sort changes', () => {
    expect(hasActiveFilters({ skillNames: ['SQL'], sort: 'recent' })).toBe(true);
    expect(hasActiveFilters({ skillNames: [], sort: 'match' })).toBe(true);
  });
});
