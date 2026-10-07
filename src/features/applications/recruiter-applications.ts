import type { ApplicationStatus, PipelineCandidate } from '../../lib/types';
import type { Database } from '../../shared/types/database';

// Linha como vem do banco: candidaturas das vagas do recrutador, com dados do
// candidato e da vaga embutidos (ver recruiter-applications.api.ts).
export interface RecruiterApplicationRow {
  id: string;
  job_id: string;
  current_stage: string;
  match_score: number;
  created_at: string;
  silver_medalist: boolean;
  last_stage_change_at: string;
  feedback_sent_at: string | null;
  jobs: { title: string } | null;
  candidate_profiles: {
    current_position: string | null;
    seniority_general: string | null;
    location: string | null;
    years_of_experience: number | null;
    profiles: { full_name: string } | null;
  } | null;
}

// Etapa do banco (applications.current_stage) -> nome mostrado na tela.
// 'withdrawn' (o candidato desistiu) nao aparece de proposito.
export const STAGE_LABELS: Record<string, ApplicationStatus> = {
  new_application: 'Em análise',
  screening: 'Triagem',
  interview: 'Entrevista',
  final_interview: 'Final',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

type DbApplicationStatus = Database['public']['Enums']['application_status'];

// Inversa de STAGE_LABELS: nome mostrado na tela -> etapa do banco.
export const DB_STAGE_BY_STATUS = Object.entries(STAGE_LABELS).reduce(
  (acc, [dbStatus, stage]) => {
    acc[stage] = dbStatus as DbApplicationStatus;
    return acc;
  },
  {} as Record<ApplicationStatus, DbApplicationStatus>,
);

export function stageToDbStatus(stage: ApplicationStatus): DbApplicationStatus {
  return DB_STAGE_BY_STATUS[stage];
}

const AVATAR_COLORS = ['bg-jm-purple', 'bg-jm-teal', 'bg-jm-orange', 'bg-primary'];

// Mesma cor sempre para a mesma candidatura.
export function avatarColorFor(id: string): string {
  let sum = 0;
  for (let index = 0; index < id.length; index += 1) {
    sum += id.charCodeAt(index);
  }
  return AVATAR_COLORS[sum % AVATAR_COLORS.length] ?? 'bg-primary';
}

// Converte uma linha do banco para o formato que as telas do recrutador usam.
// Devolve null para candidaturas desistidas.
export function mapRecruiterApplication(
  row: RecruiterApplicationRow,
): PipelineCandidate | null {
  const stage = STAGE_LABELS[row.current_stage];
  if (!stage) {
    return null;
  }

  const profile = row.candidate_profiles;

  return {
    id: row.id,
    name: profile?.profiles?.full_name?.trim() || 'Candidato(a)',
    role: profile?.current_position?.trim() || 'Cargo não informado',
    seniority: profile?.seniority_general?.trim() || 'Senioridade não informada',
    matchScore: Number(row.match_score),
    appliedDate: new Date(row.created_at).toLocaleDateString('pt-BR'),
    stage,
    avatarColor: avatarColorFor(row.id),
    jobId: row.job_id,
    jobTitle: row.jobs?.title,
    location: profile?.location ?? null,
    yearsOfExperience: profile?.years_of_experience ?? null,
    silverMedalist: row.silver_medalist,
    lastStageChangeAt: row.last_stage_change_at,
    feedbackSentAt: row.feedback_sent_at,
  };
}

// Agrupa por vaga, mantendo a ordem recebida e deixando de fora as desistidas.
export function groupCandidatesByJob(
  rows: RecruiterApplicationRow[],
): Record<string, PipelineCandidate[]> {
  const byJob: Record<string, PipelineCandidate[]> = {};
  for (const row of rows) {
    const candidate = mapRecruiterApplication(row);
    if (!candidate) {
      continue;
    }
    const current = byJob[row.job_id] ?? [];
    current.push(candidate);
    byJob[row.job_id] = current;
  }
  return byJob;
}
