import type { ApplicationStatus } from '../../lib/types';
import { getNextStage } from './pipeline-transitions';
import { STAGE_LABELS } from './recruiter-applications';

// Linha de application_stages como vem do banco.
export interface StageHistoryRow {
  new_stage: string;
  created_at: string;
}

export interface CandidateTimelineStep {
  label: string;
  date: string | null;
  done: boolean;
}

const SUBMITTED_LABEL = 'Candidatura enviada';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// Linha do tempo da candidatura: primeiro o que ja aconteceu (historico de
// etapas, em ordem), depois as etapas que ainda faltam no fluxo feliz. Apos
// Aprovado ou Rejeitado nao ha etapas pendentes.
export function buildCandidateTimeline(
  history: StageHistoryRow[] | null,
  currentStage: ApplicationStatus,
): CandidateTimelineStep[] {
  const sorted = [...(history ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  const done: CandidateTimelineStep[] =
    sorted.length === 0
      ? [{ label: SUBMITTED_LABEL, date: null, done: true }]
      : sorted.map((row, index) => ({
          label:
            index === 0
              ? SUBMITTED_LABEL
              : (STAGE_LABELS[row.new_stage] ?? row.new_stage),
          date: formatDate(row.created_at),
          done: true,
        }));

  const upcoming: CandidateTimelineStep[] = [];
  let next = getNextStage(currentStage);
  while (next) {
    upcoming.push({ label: next, date: null, done: false });
    next = getNextStage(next);
  }

  return [...done, ...upcoming];
}
