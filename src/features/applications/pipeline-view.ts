import type { ApplicationStatus, PipelineCandidate } from '../../lib/types';

// Valor do seletor que mostra as candidaturas de todas as vagas.
export const ALL_JOBS = 'all';

// Colunas do kanban, na ordem do processo. As cores seguem as da tela
// "Minhas candidaturas".
export const PIPELINE_COLUMNS: { stage: ApplicationStatus; color: string }[] = [
  { stage: 'Em análise', color: 'bg-slate-400' },
  { stage: 'Triagem', color: 'bg-blue-400' },
  { stage: 'Entrevista', color: 'bg-jm-purple' },
  { stage: 'Final', color: 'bg-jm-orange' },
  { stage: 'Aprovado', color: 'bg-jm-teal' },
  { stage: 'Rejeitado', color: 'bg-jm-red' },
];

export interface PipelineColumn {
  stage: ApplicationStatus;
  color: string;
  candidates: PipelineCandidate[];
}

export function filterCandidatesByJob(
  candidates: PipelineCandidate[],
  jobId: string,
): PipelineCandidate[] {
  if (jobId === ALL_JOBS) {
    return candidates;
  }
  return candidates.filter((candidate) => candidate.jobId === jobId);
}

// Monta as 6 colunas (mesmo vazias). Dentro de cada coluna, do maior para o
// menor match; em caso de empate, mantem a ordem recebida.
export function buildPipelineColumns(
  candidates: PipelineCandidate[],
): PipelineColumn[] {
  return PIPELINE_COLUMNS.map((column) => ({
    ...column,
    candidates: candidates
      .filter((candidate) => candidate.stage === column.stage)
      .map((candidate, index) => ({ candidate, index }))
      .sort(
        (a, b) =>
          b.candidate.matchScore - a.candidate.matchScore || a.index - b.index,
      )
      .map((entry) => entry.candidate),
  }));
}
