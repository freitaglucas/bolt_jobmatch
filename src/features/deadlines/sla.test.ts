import { describe, expect, it } from 'vitest';
import { SLA_DAYS, SLA_HOURS } from './sla';

describe('SLA de retorno', () => {
  it('e de 120 horas', () => {
    expect(SLA_HOURS).toBe(120);
  });

  it('equivale a 5 dias', () => {
    expect(SLA_DAYS).toBe(5);
  });
});
