import { describe, expect, it } from 'vitest';
import {
  candidateDeadlineText,
  getReturnDeadline,
  pickOpenDeadline,
} from './stage-deadline';

const DUE = '2026-10-06T12:00:00Z';

function at(hoursBeforeDue: number): Date {
  return new Date(new Date(DUE).getTime() - hoursBeforeDue * 3_600_000);
}

function deadline(hoursBeforeDue: number, postponeCount = 0) {
  return getReturnDeadline({
    stage: 'Triagem',
    dueAt: DUE,
    postponeCount,
    now: at(hoursBeforeDue),
  });
}

describe('getReturnDeadline', () => {
  it('uses the due date from the database and reports the days left', () => {
    const result = deadline(119);
    expect(result?.tone).toBe('ok');
    expect(result?.label).toBe('5 dias para responder');
    expect(result?.dueAt.toISOString()).toBe(new Date(DUE).toISOString());
    expect(result?.dueDateText).toBe('06/10');
  });

  it('rounds the remaining time up to whole days, then to hours in the last day', () => {
    expect(deadline(48)?.label).toBe('2 dias para responder');
    expect(deadline(24)?.label).toBe('Vence em 24h');
  });

  it('warns when less than a day is left', () => {
    const result = deadline(10);
    expect(result?.tone).toBe('soon');
    expect(result?.label).toBe('Vence em 10h');
  });

  it('flags overdue by hours and by days', () => {
    expect(deadline(-1.2)?.tone).toBe('overdue');
    expect(deadline(-1.2)?.label).toBe('Atrasado há 1h');
    expect(deadline(-24)?.label).toBe('Atrasado há 1 dia');
    expect(deadline(-48)?.label).toBe('Atrasado há 2 dias');
  });

  it('carries the number of postponements', () => {
    expect(deadline(48, 2)?.postponeCount).toBe(2);
    expect(deadline(48)?.postponeCount).toBe(0);
  });

  it('has no deadline for final stages, missing or invalid dates', () => {
    for (const stage of ['Aprovado', 'Rejeitado'] as const) {
      expect(getReturnDeadline({ stage, dueAt: DUE, now: at(10) })).toBeNull();
    }
    expect(getReturnDeadline({ stage: 'Triagem', dueAt: null, now: at(10) })).toBeNull();
    expect(getReturnDeadline({ stage: 'Triagem', dueAt: 'xyz', now: at(10) })).toBeNull();
  });
});

describe('pickOpenDeadline', () => {
  it('returns the row that was not met yet', () => {
    const open = { due_at: DUE, met_at: null, postpone_no: 1 };
    const met = { due_at: '2026-10-01T12:00:00Z', met_at: '2026-10-01T10:00:00Z', postpone_no: 0 };
    expect(pickOpenDeadline([met, open])).toBe(open);
  });

  it('returns null when everything was met or there are no rows', () => {
    expect(
      pickOpenDeadline([{ due_at: DUE, met_at: '2026-10-05T10:00:00Z', postpone_no: 0 }]),
    ).toBeNull();
    expect(pickOpenDeadline([])).toBeNull();
    expect(pickOpenDeadline(null)).toBeNull();
  });
});

describe('candidateDeadlineText', () => {
  it('tells the candidate the next return date', () => {
    expect(candidateDeadlineText(deadline(48))).toBe('Próximo retorno até 06/10/2026.');
  });

  it('says the company updated the deadline after a postponement', () => {
    expect(candidateDeadlineText(deadline(48, 1))).toContain('atualizou o prazo');
    expect(candidateDeadlineText(deadline(48, 1))).toContain('06/10/2026');
  });

  it('tells the candidate when the deadline expired', () => {
    expect(candidateDeadlineText(deadline(-30))).toContain('venceu em');
  });

  it('is empty without a deadline', () => {
    expect(candidateDeadlineText(null)).toBeNull();
  });
});
