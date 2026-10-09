import type { ApplicationFeedback, ApplicationStatus } from '../../lib/types';
import {
  buildCandidateTimeline,
  type CandidateTimelineStep,
  type StageHistoryRow,
} from './candidate-timeline';
import { STAGE_LABELS } from './recruiter-applications';
import { pickOpenDeadline, type FeedbackDeadlineRow } from './stage-deadline';

// Linha como vem do banco: candidaturas do proprio candidato, com a vaga, a
// empresa, os feedbacks recebidos e o historico de etapas embutidos (ver api.ts).
export interface CandidateApplicationRow {
  id: string;
  job_id: string;
  current_stage: string;
  match_score: number;
  created_at: string;
  feedback_deadlines: FeedbackDeadlineRow[] | null;
  jobs: { title: string; companies: { name: string } | null } | null;
  feedbacks:
    | {
        content: string;
        sent_to_candidate_at: string | null;
        created_at: string;
      }[]
    | null;
  application_stages: StageHistoryRow[] | null;
}

// Formato que a tela "Minhas candidaturas" usa.
export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string | null;
  stage: ApplicationStatus;
  matchScore: number;
  appliedDate: string;
  timeline: CandidateTimelineStep[];
  feedback: ApplicationFeedback | null;
  // Proximo retorno ate (prazo aberto em feedback_deadlines) e adiamentos usados.
  returnDueAt: string | null;
  postponeCount: number;
}

// O feedback mais recente enviado ao candidato. A policy de leitura ja limita
// aos feedbacks das candidaturas do proprio candidato.
export function latestFeedback(
  rows: CandidateApplicationRow['feedbacks'],
): ApplicationFeedback | null {
  const sent = (rows ?? []).filter((row) => row.sent_to_candidate_at);
  if (sent.length === 0) {
    return null;
  }

  const mostRecent = [...sent].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];
  if (!mostRecent) {
    return null;
  }

  return {
    content: mostRecent.content,
    sentAt: new Date(
      mostRecent.sent_to_candidate_at ?? mostRecent.created_at,
    ).toLocaleDateString('pt-BR'),
  };
}

// Converte uma linha do banco para o formato da tela do candidato. A etapa
// exibida vem de applications.current_stage (a mesma coluna que o recrutador
// atualiza). Etapa que a tela nao mostra (ex.: withdrawn) devolve null.
export function mapCandidateApplication(
  row: CandidateApplicationRow,
): CandidateApplication | null {
  const stage = STAGE_LABELS[row.current_stage];
  if (!stage) {
    return null;
  }
  const openDeadline = pickOpenDeadline(row.feedback_deadlines);

  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.jobs?.title ?? 'Vaga indisponível',
    companyName: row.jobs?.companies?.name ?? null,
    stage,
    matchScore: Number(row.match_score),
    appliedDate: new Date(row.created_at).toLocaleDateString('pt-BR'),
    timeline: buildCandidateTimeline(row.application_stages, stage),
    feedback: latestFeedback(row.feedbacks),
    returnDueAt: openDeadline?.due_at ?? null,
    postponeCount: openDeadline?.postpone_no ?? 0,
  };
}
