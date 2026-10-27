import { describe, expect, it } from 'vitest';
import type { JobSkill } from '../../jobs/types';
import type { CandidateSkill } from '../types';
import { calculateMatch } from './calculateMatch';

const jobSkill = (overrides: Partial<JobSkill>): JobSkill => ({
  id: 'js',
  job_id: 'job-1',
  skill_name: 'SQL',
  required_level: 3,
  weight: 1,
  mandatory: false,
  ...overrides,
});

const candidateSkill = (
  skill_name: string,
  declared_level: number,
): CandidateSkill => ({
  skill_name,
  declared_level,
  evidenced_by_project: false,
});

describe('calculateMatch with importance weights', () => {
  const candidate = [candidateSkill('SQL', 2), candidateSkill('Python', 2)];

  it('gives 55.56 when every skill has the same weight', () => {
    const skills = [
      jobSkill({ skill_name: 'SQL', required_level: 3, mandatory: true }),
      jobSkill({ skill_name: 'Python', required_level: 2 }),
      jobSkill({ skill_name: 'Comunicação', required_level: 2 }),
    ];
    expect(calculateMatch(skills, candidate).score).toBe(55.56);
  });

  it('gives 62.96 when the missing skill has low importance', () => {
    const skills = [
      jobSkill({ skill_name: 'SQL', required_level: 3, mandatory: true, weight: 1 }),
      jobSkill({ skill_name: 'Python', required_level: 2, weight: 0.75 }),
      jobSkill({ skill_name: 'Comunicação', required_level: 2, weight: 0.5 }),
    ];
    expect(calculateMatch(skills, candidate).score).toBe(62.96);
  });

  it('scores a mandatory skill held at a low level, without the penalty', () => {
    const skills = [
      jobSkill({ skill_name: 'SQL', required_level: 3, mandatory: true }),
      jobSkill({ skill_name: 'Python', required_level: 2 }),
    ];
    const result = calculateMatch(skills, [
      candidateSkill('SQL', 1),
      candidateSkill('Python', 2),
    ]);
    expect(result.score).toBe(66.67);
  });

  it('halves the score when the mandatory skill is absent', () => {
    const skills = [
      jobSkill({ skill_name: 'SQL', required_level: 3, mandatory: true }),
      jobSkill({ skill_name: 'Python', required_level: 2 }),
    ];
    const result = calculateMatch(skills, [candidateSkill('Python', 2)]);
    expect(result.score).toBe(25);
  });
});
