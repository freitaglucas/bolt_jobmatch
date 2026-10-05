import type { PipelineCandidate } from '../../lib/types';

// So o status da vaga importa para os totais (valores do banco).
export interface DashboardJob {
  status: string;
}

export interface RecruiterDashboardStats {
  activeJobs: number;
  pausedOrDraftJobs: number;
  closedJobs: number;
  totalApplications: number;
  newApplications: number; // ainda em "Em análise"
  interviews: number; // Entrevista + Final
  approved: number;
  rejected: number;
}

export function buildDashboardStats(
  candidates: PipelineCandidate[],
  jobs: DashboardJob[],
): RecruiterDashboardStats {
  const inStage = (...stages: PipelineCandidate['stage'][]) =>
    candidates.filter((candidate) => stages.includes(candidate.stage)).length;

  return {
    activeJobs: jobs.filter((job) => job.status === 'active').length,
    pausedOrDraftJobs: jobs.filter(
      (job) => job.status === 'paused' || job.status === 'draft',
    ).length,
    closedJobs: jobs.filter((job) => job.status === 'closed').length,
    totalApplications: candidates.length,
    newApplications: inStage('Em análise'),
    interviews: inStage('Entrevista', 'Final'),
    approved: inStage('Aprovado'),
    rejected: inStage('Rejeitado'),
  };
}

// Maiores matches entre as candidaturas que nao foram rejeitadas. Em caso de
// empate, mantem a ordem recebida.
export function pickTopCandidates(
  candidates: PipelineCandidate[],
  limit = 5,
): PipelineCandidate[] {
  return candidates
    .filter((candidate) => candidate.stage !== 'Rejeitado')
    .map((candidate, index) => ({ candidate, index }))
    .sort(
      (a, b) =>
        b.candidate.matchScore - a.candidate.matchScore || a.index - b.index,
    )
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
