import { describe, expect, it } from 'vitest';
import {
  pickUnmetRequirements,
  requirementLabel,
  withUnmetRequirements,
  type ApplicationRequirementAnswerRow,
} from './requirement-status';

const row = (
  applicationId: string,
  name: string,
  meets: boolean,
  detail: string | null = null,
): ApplicationRequirementAnswerRow => ({
  application_id: applicationId,
  meets,
  job_requirements: { detail, skills: { name } },
});

describe('requirementLabel', () => {
  it('acrescenta o detalhe da recrutadora', () => {
    expect(requirementLabel('Trabalho presencial', ' Vila Olímpia ')).toBe(
      'Trabalho presencial (Vila Olímpia)',
    );
    expect(requirementLabel('Início imediato', null)).toBe('Início imediato');
  });
});

describe('pickUnmetRequirements', () => {
  it('lista so os requisitos respondidos com nao, em ordem', () => {
    expect(
      pickUnmetRequirements([
        row('a1', 'Trabalho presencial', false),
        row('a1', 'CNH categoria B', true),
        row('a1', 'Disponibilidade aos fins de semana', false),
      ]),
    ).toEqual(['Disponibilidade aos fins de semana', 'Trabalho presencial']);
  });

  it('ignora linha sem requisito e lista vazia', () => {
    expect(pickUnmetRequirements([{ meets: false, job_requirements: null }])).toEqual([]);
    expect(pickUnmetRequirements(null)).toEqual([]);
  });
});

describe('withUnmetRequirements', () => {
  it('junta os requisitos nao atendidos as lacunas de cada candidatura', () => {
    const base = { missing: [], below: [], strengths: ['SQL'] };
    const result = withUnmetRequirements({ a1: base, a2: base }, [
      row('a1', 'Trabalho presencial', false, 'Vila Olímpia'),
      row('a2', 'Trabalho presencial', true),
    ]);
    expect(result.a1).toEqual({ ...base, unmetRequirements: ['Trabalho presencial (Vila Olímpia)'] });
    expect(result.a2).toBe(base);
  });
});
