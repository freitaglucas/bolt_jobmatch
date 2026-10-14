import { describe, expect, it } from 'vitest';
import {
  EMPTY_INSIGHTS,
  REASON_CODES,
  allGroupsConfirmed,
  buildMatchInsights,
  buildRejectionBody,
  groupByReason,
  joinList,
  levelLabel,
  resolveReasons,
  suggestReason,
  type JobSkillInput,
  type MatchInsights,
} from './rejection-reasons';

const JOB: JobSkillInput[] = [
  { skillName: 'SQL', requiredLevel: 4, weight: 9, mandatory: true },
  { skillName: 'Power BI', requiredLevel: 3, weight: 6, mandatory: true },
  { skillName: 'Python', requiredLevel: 3, weight: 5, mandatory: false },
  { skillName: 'Storytelling', requiredLevel: 2, weight: 3, mandatory: false },
];

describe('buildMatchInsights', () => {
  it('lists only mandatory skills the candidate did not inform as missing', () => {
    const insights = buildMatchInsights(JOB, [{ skillName: 'Python', declaredLevel: 4 }]);
    expect(insights.missing).toEqual(['SQL', 'Power BI']);
    expect(insights.below).toEqual([]);
    expect(insights.strengths).toEqual(['Python']);
  });

  it('flags skills informed below the required level, biggest gap first', () => {
    const insights = buildMatchInsights(JOB, [
      { skillName: 'SQL', declaredLevel: 2 },
      { skillName: 'Power BI', declaredLevel: 2 },
      { skillName: 'Python', declaredLevel: 1 },
    ]);
    expect(insights.missing).toEqual([]);
    expect(insights.below).toEqual([
      { skill: 'SQL', required: 4, declared: 2 },
      { skill: 'Power BI', required: 3, declared: 2 },
      { skill: 'Python', required: 3, declared: 1 },
    ]);
  });

  it('counts the required level or more as a strength, heaviest first', () => {
    const insights = buildMatchInsights(JOB, [
      { skillName: 'sql ', declaredLevel: 5 },
      { skillName: 'Storytelling', declaredLevel: 2 },
      { skillName: 'Power BI', declaredLevel: 3 },
    ]);
    expect(insights.strengths).toEqual(['SQL', 'Power BI', 'Storytelling']);
  });

  it('ignores optional skills the candidate did not inform', () => {
    const insights = buildMatchInsights(JOB, [
      { skillName: 'SQL', declaredLevel: 4 },
      { skillName: 'Power BI', declaredLevel: 3 },
    ]);
    expect(insights.missing).toEqual([]);
    expect(insights.below).toEqual([]);
  });
});

describe('suggestReason', () => {
  const base: MatchInsights = { missing: [], below: [], strengths: ['SQL'] };

  it('prefers a missing essential item, then a lower level, then a better fit', () => {
    expect(suggestReason({ ...base, missing: ['SQL'], below: [{ skill: 'A', required: 3, declared: 1 }] })).toBe(
      'missing_required',
    );
    expect(suggestReason({ ...base, below: [{ skill: 'A', required: 3, declared: 1 }] })).toBe(
      'level_below',
    );
    expect(suggestReason(base)).toBe('better_fit');
    expect(suggestReason(EMPTY_INSIGHTS)).toBe('better_fit');
  });
});

describe('resolveReasons and groupByReason', () => {
  const people = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const insights = {
    a: { missing: ['SQL'], below: [], strengths: [] },
    b: { missing: [], below: [{ skill: 'Python', required: 3, declared: 1 }], strengths: [] },
  };

  it('uses the suggestion unless the recruiter chose another reason', () => {
    expect(resolveReasons(people, insights, {})).toEqual({
      a: 'missing_required',
      b: 'level_below',
      c: 'better_fit',
    });
    expect(resolveReasons(people, insights, { c: 'eliminatory', a: 'job_closed' })).toEqual({
      a: 'job_closed',
      b: 'level_below',
      c: 'eliminatory',
    });
  });

  it('groups in the fixed reason order and skips empty groups', () => {
    const reasons = resolveReasons(people, insights, {});
    const groups = groupByReason(people, reasons);
    expect(groups.map((group) => group.reason)).toEqual([
      'missing_required',
      'level_below',
      'better_fit',
    ]);
    expect(groups[0]?.candidates).toEqual([{ id: 'a' }]);
    expect(REASON_CODES).toHaveLength(5);
  });

  it('needs every group confirmed (and at least one group)', () => {
    const groups = [{ reason: 'missing_required' as const }, { reason: 'better_fit' as const }];
    expect(allGroupsConfirmed([], new Set())).toBe(false);
    expect(allGroupsConfirmed(groups, new Set(['missing_required']))).toBe(false);
    expect(allGroupsConfirmed(groups, new Set(['missing_required', 'better_fit']))).toBe(true);
  });
});

describe('helpers', () => {
  it('joins lists in Portuguese', () => {
    expect(joinList([])).toBe('');
    expect(joinList(['A'])).toBe('A');
    expect(joinList(['A', 'B'])).toBe('A e B');
    expect(joinList(['A', 'B', 'C'])).toBe('A, B e C');
  });

  it('describes levels with words and clamps odd values', () => {
    expect(levelLabel(1)).toBe('iniciante');
    expect(levelLabel(3)).toBe('intermediário');
    expect(levelLabel(5)).toBe('especialista');
    expect(levelLabel(0)).toBe('iniciante');
    expect(levelLabel(9)).toBe('especialista');
  });
});

describe('buildRejectionBody', () => {
  const insights: MatchInsights = {
    missing: ['SQL', 'Power BI', 'Python', 'Excel'],
    below: [
      { skill: 'SQL', required: 4, declared: 2 },
      { skill: 'Python', required: 3, declared: 1 },
      { skill: 'Excel', required: 3, declared: 2 },
    ],
    strengths: ['Storytelling', 'Comunicação', 'Liderança', 'Negociação'],
  };
  const input = { insights, jobTitle: 'Analista de Dados', includeStrengths: true };

  it('cites at most 3 missing essentials and invites the profile update', () => {
    const body = buildRejectionBody({ ...input, reason: 'missing_required' });
    expect(body).toContain('Com base no que você informou no perfil');
    expect(body).toContain('SQL, Power BI e Python');
    expect(body).not.toContain('Excel');
    expect(body).toContain('itens essenciais');
    expect(body).toContain('atualize-o no Job Match');
  });

  it('cites the skill with the informed and the required level, in words', () => {
    const body = buildRejectionBody({ ...input, reason: 'level_below' });
    expect(body).toContain('em SQL o seu nível é básico e a vaga pede nível avançado');
    expect(body).toContain('em Python o seu nível é iniciante e a vaga pede nível intermediário');
    expect(body).not.toContain('Excel');
  });

  it('keeps the eliminatory reason generic', () => {
    const body = buildRejectionBody({ ...input, reason: 'eliminatory' });
    expect(body).toContain('localização, disponibilidade ou idioma');
  });

  it('acknowledges the profile and invites to the next jobs on a better fit', () => {
    const body = buildRejectionBody({ ...input, reason: 'better_fit' });
    expect(body).toContain('O seu perfil é bom');
    expect(body).toContain('próximas vagas');
  });

  it('is a neutral notice when the job is closed, without strengths', () => {
    const body = buildRejectionBody({ ...input, reason: 'job_closed' });
    expect(body).toContain('foi encerrada');
    expect(body).not.toContain('pontos fortes');
    expect(body).not.toContain('atualize');
  });

  it('adds up to 3 strengths only when asked', () => {
    const withStrengths = buildRejectionBody({ ...input, reason: 'better_fit' });
    expect(withStrengths).toContain('Storytelling, Comunicação e Liderança');
    expect(withStrengths).not.toContain('Negociação');
    const without = buildRejectionBody({ ...input, reason: 'better_fit', includeStrengths: false });
    expect(without).not.toContain('pontos fortes');
    const none = buildRejectionBody({
      ...input,
      insights: EMPTY_INSIGHTS,
      reason: 'better_fit',
    });
    expect(none).not.toContain('pontos fortes');
  });

  it('falls back to a generic sentence when there is no item to cite', () => {
    const missing = buildRejectionBody({ ...input, insights: EMPTY_INSIGHTS, reason: 'missing_required' });
    expect(missing).toContain('um item essencial');
    const below = buildRejectionBody({ ...input, insights: EMPTY_INSIGHTS, reason: 'level_below' });
    expect(below).toContain('abaixo do nível que a vaga pede');
  });

  it('never carries a number or score', () => {
    for (const reason of REASON_CODES) {
      expect(buildRejectionBody({ ...input, reason })).not.toMatch(/\d/);
    }
  });
});
