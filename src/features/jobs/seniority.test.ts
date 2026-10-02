import { describe, expect, it } from 'vitest';
import { CreateJobSchema, type CreateJobInput } from './create-job.schema';
import {
  SENIORITY_LABELS,
  SENIORITY_VALUES,
  seniorityLabel,
  toSeniority,
} from './seniority';

const SKILL_A = '11111111-1111-4111-8111-111111111111';

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

describe('seniority levels', () => {
  it('has the 9 levels in the expected order', () => {
    expect([...SENIORITY_VALUES]).toEqual([
      'junior',
      'pleno',
      'senior',
      'especialista',
      'coordenador',
      'gerente',
      'head',
      'diretor',
      'c_level',
    ]);
  });

  it('has a label for every level', () => {
    expect(Object.keys(SENIORITY_LABELS)).toEqual([...SENIORITY_VALUES]);
  });
});

describe('toSeniority', () => {
  it('accepts a known level', () => {
    expect(toSeniority('pleno')).toBe('pleno');
    expect(toSeniority('c_level')).toBe('c_level');
  });

  it('returns null for empty or unknown values', () => {
    expect(toSeniority(null)).toBeNull();
    expect(toSeniority(undefined)).toBeNull();
    expect(toSeniority('')).toBeNull();
    expect(toSeniority('Pleno')).toBeNull();
    expect(toSeniority('estagiario')).toBeNull();
  });
});

describe('seniorityLabel', () => {
  it('returns the label or a fallback', () => {
    expect(seniorityLabel('c_level')).toBe('C-level');
    expect(seniorityLabel(null)).toBe('Não informada');
    expect(seniorityLabel(undefined)).toBe('Não informada');
  });
});

describe('CreateJobSchema seniority', () => {
  it('accepts a job without seniority', () => {
    expect(CreateJobSchema.safeParse(validInput()).success).toBe(true);
  });

  it('accepts a valid seniority', () => {
    const parsed = CreateJobSchema.parse(validInput({ seniority: 'gerente' }));
    expect(parsed.seniority).toBe('gerente');
  });

  it('rejects an unknown seniority', () => {
    const input = { ...validInput(), seniority: 'estagiario' };
    expect(CreateJobSchema.safeParse(input).success).toBe(false);
  });
});
