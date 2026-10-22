import { describe, expect, it } from 'vitest';
import {
  RESERVE_DAYS,
  buildReserveBody,
  pickActiveReserve,
  reserveBadge,
  reserveDueDate,
} from './reserve';

const NOW = new Date(2026, 9, 22, 12, 0, 0);

describe('pickActiveReserve', () => {
  it('returns only the reserve that has not ended', () => {
    expect(
      pickActiveReserve([
        { valid_until: '2026-10-01T12:00:00Z', renewals: 1, ended_at: '2026-10-02T12:00:00Z' },
        { valid_until: '2026-11-05T12:00:00Z', renewals: 0, ended_at: null },
      ]),
    ).toEqual({ validUntil: '2026-11-05T12:00:00Z', renewals: 0 });
    expect(pickActiveReserve(null)).toBeNull();
    expect(pickActiveReserve([])).toBeNull();
  });
});

describe('reserveDueDate', () => {
  it('is 14 days from now', () => {
    expect(RESERVE_DAYS).toBe(14);
    expect(reserveDueDate(NOW).getDate()).toBe(5);
    expect(reserveDueDate(NOW).getMonth()).toBe(10);
  });
});

describe('reserveBadge', () => {
  it('shows the date, and flags a reserve that ran out without action', () => {
    expect(reserveBadge(new Date(2026, 10, 5, 12).toISOString(), NOW)).toEqual({
      text: 'Reserva até 05/11',
      overdue: false,
    });
    expect(reserveBadge(new Date(2026, 9, 20, 12).toISOString(), NOW)).toEqual({
      text: 'Reserva vencida em 20/10',
      overdue: true,
    });
    expect(reserveBadge(null, NOW)).toBeNull();
    expect(reserveBadge('nope', NOW)).toBeNull();
  });
});

describe('buildReserveBody', () => {
  it('tells the candidate about the final phase and never says "reserva"', () => {
    const first = buildReserveBody({ jobTitle: 'Analista', dueDate: reserveDueDate(NOW), renewing: false });
    const renewal = buildReserveBody({ jobTitle: 'Analista', dueDate: reserveDueDate(NOW), renewing: true });
    expect(first).toBe(
      'Você está na fase final do processo seletivo da vaga Analista. O próximo retorno sai até 05/11.',
    );
    expect(renewal).toContain('Você segue na fase final do processo seletivo');
    expect(`${first} ${renewal}`).not.toMatch(/reserva/i);
  });
});
