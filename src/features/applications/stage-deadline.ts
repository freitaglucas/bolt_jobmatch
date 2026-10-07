import type { ApplicationStatus } from '../../lib/types';
import { SLA_HOURS } from '../tokens/token-rules';

export type DeadlineTone = 'ok' | 'soon' | 'overdue' | 'answered';

export interface StageDeadline {
  tone: DeadlineTone;
  // Texto curto para o recrutador (badge do card).
  label: string;
  // Fim do prazo de retorno ao candidato.
  dueAt: Date;
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
  answered: 'bg-muted text-muted-foreground',
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

// Prazo para devolver um retorno ao candidato: SLA_HOURS depois da ultima mudanca
// de etapa. Se ja houve retorno depois dessa mudanca, o prazo esta cumprido.
// Devolve null quando a etapa nao tem prazo ou a data e invalida.
export function getStageDeadline(input: {
  stage: ApplicationStatus;
  lastStageChangeAt: string | null | undefined;
  respondedAt: string | null | undefined;
  now: Date;
  slaHours?: number;
}): StageDeadline | null {
  if (!TRACKED_STAGES.has(input.stage)) {
    return null;
  }

  const lastChange = toTime(input.lastStageChangeAt);
  if (lastChange === null) {
    return null;
  }

  const slaHours = input.slaHours ?? SLA_HOURS;
  const dueAt = new Date(lastChange + slaHours * HOUR_MS);

  const responded = toTime(input.respondedAt);
  if (responded !== null && responded >= lastChange) {
    return { tone: 'answered', label: 'Retorno enviado', dueAt };
  }

  const remainingHours = (dueAt.getTime() - input.now.getTime()) / HOUR_MS;

  if (remainingHours < 0) {
    const lateHours = -remainingHours;
    const lateDays = Math.floor(lateHours / 24);
    return {
      tone: 'overdue',
      label:
        lateDays >= 1
          ? `Atrasado há ${pluralDays(lateDays)}`
          : `Atrasado há ${Math.max(1, Math.floor(lateHours))}h`,
      dueAt,
    };
  }

  if (remainingHours <= SOON_HOURS) {
    return {
      tone: 'soon',
      label: `Vence em ${Math.max(1, Math.ceil(remainingHours))}h`,
      dueAt,
    };
  }

  return {
    tone: 'ok',
    label: `${pluralDays(Math.ceil(remainingHours / 24))} para responder`,
    dueAt,
  };
}

// Texto para o candidato em "Minhas candidaturas". Sem texto quando ja houve
// retorno (o feedback aparece na linha do tempo).
export function candidateDeadlineText(deadline: StageDeadline | null): string | null {
  if (!deadline || deadline.tone === 'answered') {
    return null;
  }
  const date = deadline.dueAt.toLocaleDateString('pt-BR');
  return deadline.tone === 'overdue'
    ? `O prazo de retorno da empresa venceu em ${date}.`
    : `A empresa deve dar um retorno até ${date}.`;
}
