// Meta de retorno no prazo (N16). Espelha as funcoes feedback_goal_target() e
// feedback_goal_discount() do banco; o teste goal-rules.test.ts trava os valores.
export const FEEDBACK_GOAL_TARGET = 0.9;
export const FEEDBACK_GOAL_DISCOUNT = 0.1;

export const GOAL_PERCENT = Math.round(FEEDBACK_GOAL_TARGET * 100);
export const DISCOUNT_PERCENT = Math.round(FEEDBACK_GOAL_DISCOUNT * 100);

// Linha de feedback_goal_attainment(): uma por vaga do recrutador.
export interface GoalRow {
  job_id: string;
  total: number;
  on_time: number;
}

export interface GoalTotals {
  total: number;
  onTime: number;
}

export type GoalState = 'empty' | 'reached' | 'missing';

export interface GoalSummary {
  state: GoalState;
  // Percentual inteiro, arredondado para baixo; null quando nao ha prazos.
  percent: number | null;
  // Retornos no prazo seguidos que faltam para chegar a meta (0 se atingida).
  missing: number;
  message: string;
}

// Primeiro dia do mes (fuso local) em ISO, para o parametro _since do banco.
export function monthStartIso(now: Date): string {
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function sumGoalRows(rows: readonly GoalRow[]): GoalTotals {
  return rows.reduce<GoalTotals>(
    (acc, row) => ({
      total: acc.total + row.total,
      onTime: acc.onTime + row.on_time,
    }),
    { total: 0, onTime: 0 },
  );
}

export function percentOnTime(total: number, onTime: number): number | null {
  if (total <= 0) {
    return null;
  }
  return Math.floor((onTime * 100) / total);
}

// Conta com inteiros para nao errar a borda (9/10, 90/100 etc.).
export function goalReached(total: number, onTime: number): boolean {
  return total > 0 && onTime * 100 >= total * GOAL_PERCENT;
}

// Quantos retornos no prazo seguidos ainda faltam para chegar a meta.
export function missingOnTime(total: number, onTime: number): number {
  if (total <= 0 || goalReached(total, onTime)) {
    return 0;
  }
  return Math.ceil((total * GOAL_PERCENT - onTime * 100) / (100 - GOAL_PERCENT));
}

function missingMessage(missing: number): string {
  const count =
    missing === 1 ? 'Mais 1 retorno no prazo garante' : `Mais ${missing} retornos no prazo seguidos garantem`;
  return `${count} ${DISCOUNT_PERCENT}% de desconto.`;
}

export function summarizeGoal(totals: GoalTotals): GoalSummary {
  const percent = percentOnTime(totals.total, totals.onTime);
  if (percent === null) {
    return {
      state: 'empty',
      percent: null,
      missing: 0,
      message: 'Ainda não há retornos com prazo neste mês.',
    };
  }
  if (goalReached(totals.total, totals.onTime)) {
    return {
      state: 'reached',
      percent,
      missing: 0,
      message: `Neste mês você garantiria ${DISCOUNT_PERCENT}% de desconto.`,
    };
  }
  const missing = missingOnTime(totals.total, totals.onTime);
  return { state: 'missing', percent, missing, message: missingMessage(missing) };
}

// Pior indice primeiro: a recrutadora ve onde agir antes.
export function sortRowsWorstFirst(rows: readonly GoalRow[]): GoalRow[] {
  return rows
    .filter((row) => row.total > 0)
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const diff = a.row.on_time / a.row.total - b.row.on_time / b.row.total;
      return diff !== 0 ? diff : b.row.total - a.row.total || a.index - b.index;
    })
    .map((entry) => entry.row);
}

export interface OpenDeadlineCounts {
  overdue: number;
  dueToday: number;
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Prazos abertos: atrasados (ja venceram) e que vencem hoje (dia local).
export function countOpenDeadlines(
  candidates: readonly { returnDueAt?: string | null }[],
  now: Date,
): OpenDeadlineCounts {
  const counts: OpenDeadlineCounts = { overdue: 0, dueToday: 0 };
  for (const candidate of candidates) {
    if (!candidate.returnDueAt) {
      continue;
    }
    const due = new Date(candidate.returnDueAt);
    if (Number.isNaN(due.getTime())) {
      continue;
    }
    if (due.getTime() < now.getTime()) {
      counts.overdue += 1;
    } else if (sameLocalDay(due, now)) {
      counts.dueToday += 1;
    }
  }
  return counts;
}
