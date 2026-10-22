// Reserva interna de finalistas (N83). So o recrutador ve a palavra "reserva":
// o candidato recebe uma atualizacao comum ("fase final do processo seletivo").
// Regras no banco: supabase/migrations/20261022000000_application_reserves.sql.

export const RESERVE_DAYS = 14;
export const MAX_RESERVE_RENEWALS = 1;

export interface ReserveRow {
  valid_until: string;
  renewals: number;
  ended_at: string | null;
}

export interface ActiveReserve {
  validUntil: string;
  renewals: number;
}

export function pickActiveReserve(rows: ReserveRow[] | null | undefined): ActiveReserve | null {
  const active = (rows ?? []).find((row) => row.ended_at === null);
  return active ? { validUntil: active.valid_until, renewals: active.renewals } : null;
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Data da resposta final de uma reserva feita (ou renovada) agora.
export function reserveDueDate(now: Date): Date {
  return new Date(now.getTime() + RESERVE_DAYS * 24 * 3_600_000);
}

// Selo do card no Pipeline (so o recrutador ve).
export function reserveBadge(
  validUntil: string | null | undefined,
  now: Date,
): { text: string; overdue: boolean } | null {
  if (!validUntil) {
    return null;
  }
  const due = new Date(validUntil);
  if (Number.isNaN(due.getTime())) {
    return null;
  }
  const overdue = due.getTime() < now.getTime();
  return {
    text: overdue ? `Reserva vencida em ${shortDate(due)}` : `Reserva até ${shortDate(due)}`,
    overdue,
  };
}

// Corpo da mensagem ao candidato. Nunca fala em "reserva".
export function buildReserveBody(input: {
  jobTitle: string;
  dueDate: Date;
  renewing: boolean;
}): string {
  const verb = input.renewing ? 'segue' : 'está';
  return `Você ${verb} na fase final do processo seletivo da vaga ${input.jobTitle}. O próximo retorno sai até ${shortDate(input.dueDate)}.`;
}
