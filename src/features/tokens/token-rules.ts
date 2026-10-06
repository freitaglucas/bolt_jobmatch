export const SLA_HOURS = 120;
export const INITIAL_TOKENS = 20;
export const FEEDBACK_REWARD = 1;

export interface TokenLedgerRow {
  id: string;
  amount: number;
  kind: string;
  application_id: string | null;
  stage: string | null;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  title: string;
  amount: number;
  type: 'earn' | 'spend';
  createdAt: string;
}

const LEDGER_TITLES: Record<string, string> = {
  initial_grant: 'Tokens de boas-vindas',
  stage_move_debit: 'Movimentação de etapa (regra anterior)',
  feedback_credit: 'Feedback enviado no prazo',
};

export function mapLedgerRow(row: TokenLedgerRow): LedgerEntry {
  return {
    id: row.id,
    title: LEDGER_TITLES[row.kind] ?? 'Movimentação de tokens',
    amount: Math.abs(row.amount),
    type: row.amount >= 0 ? 'earn' : 'spend',
    createdAt: row.created_at,
  };
}

// Reservado para as automacoes pagas (N15): o banco levantara 'insufficient_tokens'
// quando a automacao exigir saldo. Mover etapa e rejeitar nunca bloqueiam por saldo.
export function isInsufficientTokensError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && message.includes('insufficient_tokens');
}

export interface MonthTotals {
  earned: number;
  spent: number;
}

// Soma ganhos e gastos do mes (e ano) de "now", no fuso local.
export function summarizeMonth(entries: LedgerEntry[], now: Date): MonthTotals {
  const totals: MonthTotals = { earned: 0, spent: 0 };
  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    if (
      date.getFullYear() !== now.getFullYear() ||
      date.getMonth() !== now.getMonth()
    ) {
      continue;
    }
    if (entry.type === 'earn') {
      totals.earned += entry.amount;
    } else {
      totals.spent += entry.amount;
    }
  }
  return totals;
}

export function formatLedgerDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('pt-BR');
}
