import { describe, expect, it } from 'vitest';
import {
  DISCOUNT_PERCENT,
  FEEDBACK_GOAL_DISCOUNT,
  FEEDBACK_GOAL_TARGET,
  GOAL_PERCENT,
  countOpenDeadlines,
  goalReached,
  missingOnTime,
  monthStartIso,
  percentOnTime,
  sortRowsWorstFirst,
  sumGoalRows,
  summarizeGoal,
} from './goal-rules';

describe('constantes da meta', () => {
  it('espelham as funcoes do banco (90% de meta, 10% de desconto)', () => {
    expect(FEEDBACK_GOAL_TARGET).toBe(0.9);
    expect(FEEDBACK_GOAL_DISCOUNT).toBe(0.1);
    expect(GOAL_PERCENT).toBe(90);
    expect(DISCOUNT_PERCENT).toBe(10);
  });
});

describe('percentOnTime', () => {
  it('devolve null sem prazos', () => {
    expect(percentOnTime(0, 0)).toBeNull();
  });

  it('arredonda para baixo', () => {
    expect(percentOnTime(3, 2)).toBe(66);
    expect(percentOnTime(10, 9)).toBe(90);
    expect(percentOnTime(1000, 899)).toBe(89);
  });
});

describe('goalReached', () => {
  it('sem prazos nao atinge', () => {
    expect(goalReached(0, 0)).toBe(false);
  });

  it('atinge exatamente em 90%', () => {
    expect(goalReached(10, 9)).toBe(true);
    expect(goalReached(100, 90)).toBe(true);
  });

  it('nao atinge abaixo de 90%', () => {
    expect(goalReached(10, 8)).toBe(false);
    expect(goalReached(100, 89)).toBe(false);
  });
});

describe('missingOnTime', () => {
  it('zero quando ja atingiu ou nao ha prazos', () => {
    expect(missingOnTime(0, 0)).toBe(0);
    expect(missingOnTime(10, 9)).toBe(0);
  });

  it('conta quantos retornos no prazo seguidos faltam', () => {
    expect(missingOnTime(10, 8)).toBe(10);
    expect(missingOnTime(100, 89)).toBe(10);
    expect(missingOnTime(1, 0)).toBe(9);
    expect(missingOnTime(5, 4)).toBe(5);
  });

  it('com esse numero de retornos no prazo a meta e atingida', () => {
    for (const [total, onTime] of [
      [10, 8],
      [100, 89],
      [1, 0],
      [7, 3],
    ]) {
      const k = missingOnTime(total, onTime);
      expect(goalReached(total + k, onTime + k)).toBe(true);
      if (k > 0) {
        expect(goalReached(total + k - 1, onTime + k - 1)).toBe(false);
      }
    }
  });
});

describe('summarizeGoal', () => {
  it('sem prazos no mes', () => {
    const summary = summarizeGoal({ total: 0, onTime: 0 });
    expect(summary.state).toBe('empty');
    expect(summary.percent).toBeNull();
    expect(summary.message).toBe('Ainda não há retornos com prazo neste mês.');
  });

  it('meta atingida garante o desconto', () => {
    const summary = summarizeGoal({ total: 10, onTime: 9 });
    expect(summary.state).toBe('reached');
    expect(summary.percent).toBe(90);
    expect(summary.message).toBe('Neste mês você garantiria 10% de desconto.');
  });

  it('meta nao atingida diz quantos faltam', () => {
    const summary = summarizeGoal({ total: 10, onTime: 8 });
    expect(summary.state).toBe('missing');
    expect(summary.percent).toBe(80);
    expect(summary.missing).toBe(10);
    expect(summary.message).toBe('Mais 10 retornos no prazo seguidos garantem 10% de desconto.');
  });

  it('usa singular quando falta 1', () => {
    expect(summarizeGoal({ total: 9, onTime: 8 }).message).toBe(
      'Mais 1 retorno no prazo garante 10% de desconto.',
    );
  });
});

describe('sumGoalRows e sortRowsWorstFirst', () => {
  const rows = [
    { job_id: 'a', total: 10, on_time: 9 },
    { job_id: 'b', total: 4, on_time: 1 },
    { job_id: 'c', total: 10, on_time: 5 },
    { job_id: 'd', total: 0, on_time: 0 },
  ];

  it('soma as vagas', () => {
    expect(sumGoalRows(rows)).toEqual({ total: 24, onTime: 15 });
    expect(sumGoalRows([])).toEqual({ total: 0, onTime: 0 });
  });

  it('ordena do pior para o melhor e ignora vagas sem prazos', () => {
    expect(sortRowsWorstFirst(rows).map((row) => row.job_id)).toEqual(['b', 'c', 'a']);
  });
});

describe('countOpenDeadlines', () => {
  const now = new Date(2026, 9, 17, 12, 0, 0);

  it('conta atrasados e os que vencem hoje; ignora amanha e vazios', () => {
    const counts = countOpenDeadlines(
      [
        { returnDueAt: new Date(2026, 9, 17, 9, 0, 0).toISOString() },
        { returnDueAt: new Date(2026, 9, 16, 9, 0, 0).toISOString() },
        { returnDueAt: new Date(2026, 9, 17, 18, 0, 0).toISOString() },
        { returnDueAt: new Date(2026, 9, 17, 23, 0, 0).toISOString() },
        { returnDueAt: new Date(2026, 9, 18, 9, 0, 0).toISOString() },
        { returnDueAt: null },
        {},
        { returnDueAt: 'invalida' },
      ],
      now,
    );
    expect(counts).toEqual({ overdue: 2, dueToday: 2 });
  });
});

describe('monthStartIso', () => {
  it('aponta para o dia 1 do mes local', () => {
    const iso = monthStartIso(new Date(2026, 9, 17, 12, 0, 0));
    const date = new Date(iso);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(0);
  });
});
