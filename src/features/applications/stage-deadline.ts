import type { ApplicationStatus } from '../../lib/types';

export type DeadlineTone = 'ok' | 'soon' | 'overdue';

export interface StageDeadline {
  tone: DeadlineTone;
  // Texto curto para o recrutador (badge do card).
  label: string;
  // Data do proximo retorno ("17/10") para exibir ao lado do texto.
  dueDateText: string;
  // Fim do prazo de retorno ao candidato.
  dueAt: Date;
  // Quantas vezes o prazo desta etapa ja foi adiado (atualizacao honesta).
  postponeCount: number;
}

// Linha de feedback_deadlines como vem do banco (embutida na candidatura).
export interface FeedbackDeadlineRow {
  due_at: string;
  met_at: string | null;
  postpone_no: number;
}

const HOUR_MS = 3_600_000;
const SOON_HOURS = 24;

// Etapas em que o candidato ainda espera retorno. Aprovado e Rejeitado nao tem prazo.
const TRACKED_STAGES: ReadonlySet<ApplicationStatus> = new Set<ApplicationStatus>([
  'Em análise',
  'Triagem',
  'Entrevista',
  'Final',
]);

export const DEADLINE_TONE_CLASSES: Record<DeadlineTone, string> = {
  ok: 'bg-jm-teal/15 text-jm-teal',
  soon: 'bg-jm-orange/15 text-jm-orange',
  overdue: 'bg-jm-red/15 text-jm-red',
};

function toTime(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function pluralDays(days: number): string {
  return days === 1 ? '1 dia' : `${days} dias`;
}

// O prazo aberto da candidatura (met_at nulo). O banco garante no maximo um.
export function pickOpenDeadline(
  rows: readonly FeedbackDeadlineRow[] | null | undefined,
): FeedbackDeadlineRow | null {
  return (rows ?? []).find((row) => row.met_at === null) ?? null;
}

// Prazo de retorno ao candidato: a data vem do banco (feedback_deadlines), que
// nasce do SLA da etapa e muda com a mudanca de etapa, o feedback ou a
// atualizacao honesta. Devolve null quando a etapa nao tem prazo, quando nao ha
// prazo aberto ou quando a data e invalida.
export function getReturnDeadline(input: {
  stage: ApplicationStatus;
  dueAt: string | null | undefined;
  postponeCount?: number;
  now: Date;
}): StageDeadline | null {
  if (!TRACKED_STAGES.has(input.stage)) {
    return null;
  }

  const due = toTime(input.dueAt);
  if (due === null) {
    return null;
  }

  const dueAt = new Date(due);
  const postponeCount = input.postponeCount ?? 0;
  const dueDateText = dueAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
  const remainingHours = (due - input.now.getTime()) / HOUR_MS;

  if (remainingHours < 0) {
    const lateHours = -remainingHours;
    const lateDays = Math.floor(lateHours / 24);
    return {
      tone: 'overdue',
      label:
        lateDays >= 1
          ? `Atrasado há ${pluralDays(lateDays)}`
          : `Atrasado há ${Math.max(1, Math.floor(lateHours))}h`,
      dueDateText,
      dueAt,
      postponeCount,
    };
  }

  if (remainingHours <= SOON_HOURS) {
    return {
      tone: 'soon',
      label: `Vence em ${Math.max(1, Math.ceil(remainingHours))}h`,
      dueDateText,
      dueAt,
      postponeCount,
    };
  }

  return {
    tone: 'ok',
    label: `${pluralDays(Math.ceil(remainingHours / 24))} para responder`,
    dueDateText,
    dueAt,
    postponeCount,
  };
}

// Texto para o candidato em "Minhas candidaturas" (linha do tempo).
export function candidateDeadlineText(deadline: StageDeadline | null): string | null {
  if (!deadline) {
    return null;
  }
  const date = deadline.dueAt.toLocaleDateString('pt-BR');
  if (deadline.tone === 'overdue') {
    return `O prazo de retorno da empresa venceu em ${date}.`;
  }
  return deadline.postponeCount > 0
    ? `A empresa atualizou o prazo. Próximo retorno até ${date}.`
    : `Próximo retorno até ${date}.`;
}
