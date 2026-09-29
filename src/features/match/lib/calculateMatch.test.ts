import { describe, expect, it } from 'vitest';
import type { JobSkill } from '../../jobs/types';
import type { CandidateSkill } from '../types';
import { calculateMatch } from './calculateMatch';

const createJobSkill = (overrides: Partial<JobSkill> = {}): JobSkill => ({
  id: 'job-skill-1',
  job_id: 'job-1',
  skill_name: 'TypeScript',
  required_level: 4,
  weight: 10,
  mandatory: false,
  ...overrides,
});

const createCandidateSkill = (
  overrides: Partial<CandidateSkill> = {},
): CandidateSkill => ({
  skill_name: 'TypeScript',
  declared_level: 2,
  evidenced_by_project: false,
  ...overrides,
});

describe('calculateMatch', () => {
  it('calculates weighted partial scores proportionally', () => {
    const result = calculateMatch(
      [createJobSkill()],
      [createCandidateSkill()],
    );

    expect(result.score).toBe(50);
    expect(result.factors[0].partial).toBe(5);
    expect(result.factors[0].gap).toBe(2);
  });

  it('does not penalize an absent optional skill', () => {
    const result = calculateMatch([createJobSkill()], []);

    expect(result.score).toBe(0);
    expect(result.factors[0]).toMatchObject({
      declared: 0,
      partial: 0,
      gap: 4,
      mandatory: false,
    });
  });

  it('applies the mandatory-skill penalty once', () => {
    const skills = [
      createJobSkill({ mandatory: true }),
      createJobSkill({
        id: 'job-skill-2',
        skill_name: 'React',
        mandatory: true,
      }),
    ];
    const candidateSkills = [
      createCandidateSkill({ declared_level: 4 }),
    ];

    expect(calculateMatch(skills, candidateSkills).score).toBe(25);
  });

  it('applies project evidence bonus and caps the candidate level at five', () => {
    const result = calculateMatch(
      [createJobSkill({ required_level: 5 })],
      [
        createCandidateSkill({
          declared_level: 5,
          evidenced_by_project: true,
        }),
      ],
    );

    expect(result.score).toBe(100);
    expect(result.factors[0]).toMatchObject({
      declared: 5,
      partial: 10,
    });
  });

  it('returns zero and no factors when the job has no required skills', () => {
    expect(calculateMatch([], [])).toEqual({ score: 0, factors: [] });
  });

  it('returns zero when the sum of skill weights is zero', () => {
    const result = calculateMatch(
      [createJobSkill({ weight: 0 })],
      [createCandidateSkill({ declared_level: 4 })],
    );

    expect(result.score).toBe(0);
    expect(result.factors).toHaveLength(1);
  });

  it('matches skill names case-insensitively and ignoring surrounding whitespace', () => {
    const result = calculateMatch(
      [createJobSkill({ skill_name: '  TypeScript  ' })],
      [
        createCandidateSkill({
          skill_name: 'typescript',
          declared_level: 4,
        }),
      ],
    );

    expect(result.score).toBe(100);
  });
});
