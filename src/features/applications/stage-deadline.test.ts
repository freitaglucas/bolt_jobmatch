import { describe, expect, it } from 'vitest';
import { candidateDeadlineText, getStageDeadline } from './stage-deadline';

const CHANGED = '2026-10-01T12:00:00Z';

function at(hoursAfterChange: number): Date {
  return new Date(new Date(CHANGED).getTime() + hoursAfterChange * 3_600_000);
}

function deadline(hoursAfterChange: number, respondedAt: string | null = null) {
  return getStageDeadline({
    stage: 'Triagem',
    lastStageChangeAt: CHANGED,
    respondedAt,
    now: at(hoursAfterChange),
  });
}

describe('getStageDeadline', () => {
  it('uses a 5-day window and reports the days left', () => {
    const result = deadline(1);
    expect(result?.tone).toBe('ok');
    expect(result?.label).toBe('5 dias para responder');
    expect(result?.dueAt.toISOString()).toBe('2026-10-06T12:00:00.000Z');
  });

  it('rounds the remaining time up to whole days, then to hours in the last day', () => {
    expect(deadline(72)?.label).toBe('2 dias para responder');
    expect(deadline(96.5)?.label).toBe('Vence em 24h');
  });

  it('warns when less than a day is left', () => {
    const result = deadline(110);
    expect(result?.tone).toBe('soon');
    expect(result?.label).toBe('Vence em 10h');
  });

  it('flags overdue by hours and by days', () => {
    expect(deadline(121.2)?.tone).toBe('overdue');
    expect(deadline(121.2)?.label).toBe('Atrasado há 1h');
    expect(deadline(121 + 48)?.label).toBe('Atrasado há 2 dias');
    expect(deadline(121 + 24)?.label).toBe('Atrasado há 1 dia');
  });

  it('is answered when feedback was sent after the last stage change', () => {
    const result = deadline(200, '2026-10-03T09:00:00Z');
    expect(result?.tone).toBe('answered');
    expect(result?.label).toBe('Retorno enviado');
  });

  it('ignores feedback sent before the last stage change', () => {
    expect(deadline(200, '2026-09-30T09:00:00Z')?.tone).toBe('overdue');
  });

  it('has no deadline for final stages or invalid dates', () => {
    for (const stage of ['Aprovado', 'Rejeitado'] as const) {
      expect(
        getStageDeadline({
          stage,
          lastStageChangeAt: CHANGED,
          respondedAt: null,
          now: at(1),
        }),
      ).toBeNull();
    }
    expect(
      getStageDeadline({
        stage: 'Triagem',
        lastStageChangeAt: 'xyz',
        respondedAt: null,
        now: at(1),
      }),
    ).toBeNull();
  });
});

describe('candidateDeadlineText', () => {
  it('tells the candidate the date, or that it expired', () => {
    expect(candidateDeadlineText(deadline(1))).toContain('06/10/2026');
    expect(candidateDeadlineText(deadline(1))).toContain('deve dar um retorno');
    expect(candidateDeadlineText(deadline(130))).toContain('venceu em');
  });

  it('is empty when answered or without a deadline', () => {
    expect(candidateDeadlineText(deadline(10, '2026-10-02T00:00:00Z'))).toBeNull();
    expect(candidateDeadlineText(null)).toBeNull();
  });
});
