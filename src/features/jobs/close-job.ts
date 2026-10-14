import type { PipelineCandidate } from '../../lib/types';
import {
  DEFAULT_CLOSING,
  DEFAULT_OPENING,
  buildBatchPlan,
  runBatchFeedback,
  type BatchEntry,
  type BatchOutcome,
  type BatchRunDeps,
  type ExcludedCandidate,
} from '../applications/batch-feedback';
import { canReject } from '../applications/pipeline-transitions';

// Encerrar a vaga (N64). O banco so deixa fechar sem candidatos pendentes
// (job_has_pending_candidates). A tela oferece o retorno final em um clique:
// cada pendente recebe o aviso de "vaga encerrada", vai para Rejeitado e so
// depois a vaga fecha.

export const PENDING_CANDIDATES_ERROR = 'job_has_pending_candidates';

// Quem ainda aguarda retorno: etapas ativas (nao aprovado nem rejeitado).
export function pendingCandidates(
  candidates: readonly PipelineCandidate[],
): PipelineCandidate[] {
  return candidates.filter((candidate) => canReject(candidate.stage));
}

// Retorno final de cada pendente: motivo "vaga encerrada", sem pontos fortes.
export function buildCloseJobPlan(
  pending: PipelineCandidate[],
  now: Date,
): { entries: BatchEntry[]; excluded: ExcludedCandidate[] } {
  return buildBatchPlan({
    type: 'reject',
    candidates: pending,
    opening: DEFAULT_OPENING,
    closing: DEFAULT_CLOSING,
    dueDate: '',
    now,
    rejection: {
      reasons: Object.fromEntries(
        pending.map((candidate) => [candidate.id, 'job_closed' as const]),
      ),
      insights: {},
      includeStrengths: false,
    },
  });
}

export function isPendingCandidatesError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && message.includes(PENDING_CANDIDATES_ERROR);
}

export function closeJobErrorMessage(error: unknown): string {
  return isPendingCandidatesError(error)
    ? 'Ainda há candidatos aguardando retorno nesta vaga (talvez alguém tenha acabado de se candidatar). Dê o retorno e tente de novo.'
    : 'Os retornos foram enviados, mas não foi possível encerrar a vaga. Tente de novo.';
}

export interface CloseJobDeps extends BatchRunDeps {
  close(): Promise<void>;
}

export interface CloseJobResult {
  outcomes: BatchOutcome[];
  closed: boolean;
  // Quando a vaga continua aberta: por que.
  message: string | null;
}

// Envia o retorno final e muda a etapa de cada pendente; so fecha a vaga se
// todos foram movidos. Sem pendentes, fecha direto.
export async function runCloseJob(
  deps: CloseJobDeps,
  entries: BatchEntry[],
  onProgress?: (done: number, total: number) => void,
): Promise<CloseJobResult> {
  const outcomes = entries.length > 0 ? await runBatchFeedback(deps, entries, onProgress) : [];
  const allMoved =
    outcomes.length === entries.length && outcomes.every((outcome) => outcome.moved === true);

  if (!allMoved) {
    return {
      outcomes,
      closed: false,
      message:
        'Alguns candidatos ainda não receberam o retorno final. A vaga continua aberta: resolva os casos abaixo e tente encerrar de novo.',
    };
  }

  try {
    await deps.close();
    return { outcomes, closed: true, message: null };
  } catch (error) {
    return { outcomes, closed: false, message: closeJobErrorMessage(error) };
  }
}
