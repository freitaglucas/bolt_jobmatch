import { describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/lib/supabase', () => ({ supabase: {} }));
vi.mock('../recruiters/api', () => ({ getRecruiterOnboarding: vi.fn() }));

import { buildJobSkillRows } from './create-job';
import { CreateJobSchema, type CreateJobInput } from './create-job.schema';
import {
  DEFAULT_IMPORTANCE,
  IMPORTANCE_LABELS,
  IMPORTANCE_VALUES,
  IMPORTANCE_WEIGHTS,
  weightForImportance,
} from './importance';

const SKILL_A = '11111111-1111-4111-8111-111111111111';
const SKILL_B = '22222222-2222-4222-8222-222222222222';
const SKILL_C = '33333333-3333-4333-8333-333333333333';

function validInput(overrides: Partial<CreateJobInput> = {}): CreateJobInput {
  return {
    title: 'Analista de Inovação',
    location: 'São Paulo, SP',
    description: 'Vaga para atuar com projetos de inovação aberta.',
    employmentType: 'CLT',
    skills: [{ skillId: SKILL_A, requiredLevel: 3, mandatory: true }],
    ...overrides,
  };
}

describe('importance levels', () => {
  it('maps each level to its weight', () => {
    expect(IMPORTANCE_WEIGHTS).toEqual({ high: 1, medium: 0.75, low: 0.5 });
  });

  it('has a label for every level, in order', () => {
    expect([...IMPORTANCE_VALUES]).toEqual(['high', 'medium', 'low']);
    expect(Object.keys(IMPORTANCE_LABELS)).toEqual([...IMPORTANCE_VALUES]);
  });

  it('uses high importance (weight 1) by default', () => {
    expect(DEFAULT_IMPORTANCE).toBe('high');
    expect(weightForImportance()).toBe(1);
    expect(weightForImportance(null)).toBe(1);
    expect(weightForImportance('low')).toBe(0.5);
  });
});

describe('CreateJobSchema importance', () => {
  it('accepts skills without importance', () => {
    expect(CreateJobSchema.safeParse(validInput()).success).toBe(true);
  });

  it('accepts a valid importance', () => {
    const input = validInput({
      skills: [
        { skillId: SKILL_A, requiredLevel: 3, mandatory: true, importance: 'low' },
      ],
    });
    expect(CreateJobSchema.safeParse(input).success).toBe(true);
  });

  it('rejects an unknown importance', () => {
    const input = {
      ...validInput(),
      skills: [
        { skillId: SKILL_A, requiredLevel: 3, mandatory: true, importance: 'altissima' },
      ],
    };
    expect(CreateJobSchema.safeParse(input).success).toBe(false);
  });
});

describe('buildJobSkillRows weights', () => {
  it('turns importance into the weight of each job_skills row', () => {
    expect(
      buildJobSkillRows('job-1', [
        { skillId: SKILL_A, requiredLevel: 4, mandatory: true, importance: 'high' },
        { skillId: SKILL_B, requiredLevel: 3, mandatory: false, importance: 'medium' },
        { skillId: SKILL_C, requiredLevel: 3, mandatory: false, importance: 'low' },
      ]).map((row) => row.weight),
    ).toEqual([1, 0.75, 0.5]);
  });

  it('keeps weight 1 when importance is not informed', () => {
    const rows = buildJobSkillRows('job-1', [
      { skillId: SKILL_A, requiredLevel: 4, mandatory: false },
    ]);
    expect(rows[0].weight).toBe(1);
  });
});
