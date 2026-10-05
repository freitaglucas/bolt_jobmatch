import type { ApplicationFeedback, ApplicationStatus } from '../../lib/types';
import { STAGE_LABELS } from './recruiter-applications';

// Linha como vem do banco: candidaturas do proprio candidato, com o titulo da
// vaga e os feedbacks recebidos embutidos (ver api.ts).
export interface CandidateApplicationRow {
  id: string;
  job_id: string;
  current_stage: string;
  match_score: number;
  created_at: string;
  jobs: { title: string } | null;
  feedbacks:
    | {
        content: string;
        sent_to_candidate_at: string | null;
        created_at: string;
      }[]
    | null;
}

// Formato que a tela "Minhas candidaturas" usa.
export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  stage: ApplicationStatus;
  matchScore: number;
  appliedDate: string;
  feedback: ApplicationFeedback | null;
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
// atualiza).
export function mapCandidateApplication(
  row: CandidateApplicationRow,
): CandidateApplication {
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.jobs?.title ?? 'Vaga',
    stage: STAGE_LABELS[row.current_stage] ?? 'Em análise',
    matchScore: Number(row.match_score),
    appliedDate: new Date(row.created_at).toLocaleDateString('pt-BR'),
    feedback: latestFeedback(row.feedbacks),
  };
}
