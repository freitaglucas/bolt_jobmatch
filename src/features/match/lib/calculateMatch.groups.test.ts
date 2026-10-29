import { describe, expect, it } from 'vitest';
import type { JobSkill } from '../../jobs/types';
import type { CandidateSkill } from '../types';
import { calculateMatch } from './calculateMatch';

const item = (skill_name: string, overrides: Partial<JobSkill> = {}): JobSkill => ({
  id: skill_name,
  job_id: 'job-1',
  skill_name,
  required_level: 2,
  weight: 1,
  mandatory: true,
  group_id: 'g1',
  group_min: 1,
  ...overrides,
});

const has = (skill_name: string, declared_level = 2): CandidateSkill => ({
  skill_name,
  declared_level,
  evidenced_by_project: false,
});

describe('calculateMatch com grupos de alternativas (N33)', () => {
  const cloud = [item('AWS'), item('GCP'), item('Azure')];

  it('o grupo vale como um item: ter um dos tres basta', () => {
    expect(calculateMatch(cloud, [has('GCP')]).score).toBe(100);
  });

  it('marca o grupo em cada fator, com minimo, tamanho e se atende', () => {
    const result = calculateMatch(cloud, [has('Azure')]);
    expect(result.factors.map((factor) => factor.group)).toEqual([
      { id: 'g1', min: 1, size: 3, met: true },
      { id: 'g1', min: 1, size: 3, met: true },
      { id: 'g1', min: 1, size: 3, met: true },
    ]);
  });

  it('grupo obrigatorio sem nenhum item corta o score pela metade', () => {
    const result = calculateMatch([...cloud, item('SQL', { group_id: null })], [has('SQL')]);
    expect(result.score).toBe(25);
    expect(result.factors[0]?.group?.met).toBe(false);
  });

  it('item fora de grupo nao ganha o campo group', () => {
    const result = calculateMatch([item('SQL', { group_id: null })], [has('SQL')]);
    expect(result.factors[0]).not.toHaveProperty('group');
  });
});
