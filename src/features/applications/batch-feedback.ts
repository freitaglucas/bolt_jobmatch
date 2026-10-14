import type { ApplicationStatus, PipelineCandidate } from '../../lib/types';
import { batchItemErrorLabel } from '../email/batch-feedback.errors';
import type {
  BatchRequestItem,
  BatchResponse,
} from '../email/batch-feedback.schemas';
import { SLA_HOURS } from '../tokens/token-rules';
import { canReject, getNextStage } from './pipeline-transitions';
import {
  EMPTY_INSIGHTS,
  buildRejectionBody,
  type MatchInsights,
  type ReasonCode,
} from './rejection-reasons';

// Retorno em lote ao candidato (N15b). Regras puras: elegibilidade, mensagem,
// plano de envio e orquestracao. A tela so liga isso aos botoes.

// "Nao avancou" leva um dos 5 motivos por candidato (N62).
export type BatchFeedbackType = 'update' | 'advance' | 'reject';

export const BATCH_CHUNK_SIZE = 25;
export const BATCH_TEXT_MAX_LENGTH = 300;
export const MAX_POSTPONES_PER_STAGE = 2;
// O banco aceita ate 14 dias; a tela deixa ate 13 (a hora fixa de 18h nao estoura o limite).
export const MAX_POSTPONE_DAYS_PICKER = 13;
export const RETURN_HOUR = 18;

export const DEFAULT_OPENING = 'Olá, {nome}!';
export const DEFAULT_CLOSING =
  'Agradecemos o seu interesse e o tempo dedicado ao processo. Se tiver qualquer dúvida, é só responder a este e-mail.';

const UPDATE_STAGES: ReadonlySet<ApplicationStatus> = new Set<ApplicationStatus>([
  'Em análise',
  'Triagem',
  'Entrevista',
  'Final',
]);
// A aprovacao (Final -> Aprovado) fica no fluxo individual.
const ADVANCE_STAGES: ReadonlySet<ApplicationStatus> = new Set<ApplicationStatus>([
  'Em análise',
  'Triagem',
  'Entrevista',
]);

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatBr(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

function localDate(year: number, month: number, day: number, hour = 0): Date {
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

function parseDateInput(value: string): Date | null {
  const match = DATE_RE.exec(value);
  if (!match) {
    return null;
  }
  const [, y, m, d] = match;
  const date = localDate(Number(y), Number(m), Number(d));
  // Rejeita datas que o calendario "corrige" (31/02 vira marco).
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(m) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return null;
  }
  return date;
}

// YYYY-MM-DD no fuso local (valor do <input type="date">).
export function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Menor e maior data que a tela aceita: de amanha ate hoje + 13 dias.
export function dueDateBounds(now: Date): { min: string; max: string } {
  const min = localDate(now.getFullYear(), now.getMonth() + 1, now.getDate() + 1);
  const max = localDate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate() + MAX_POSTPONE_DAYS_PICKER,
  );
  return { min: toDateInputValue(min), max: toDateInputValue(max) };
}

// Data padrao do prazo novo: 7 dias a partir de hoje.
export function defaultDueDate(now: Date): string {
  return toDateInputValue(localDate(now.getFullYear(), now.getMonth() + 1, now.getDate() + 7));
}

// Erro de validacao da data escolhida, ou null se valida.
export function validateDueDate(value: string, now: Date): string | null {
  const date = parseDateInput(value);
  if (!date) {
    return 'Escolha a nova data de retorno.';
  }
  const { min, max } = dueDateBounds(now);
  if (value < min) {
    return 'A nova data precisa ser a partir de amanhã.';
  }
  if (value > max) {
    return `A nova data pode ser de no máximo ${MAX_POSTPONE_DAYS_PICKER} dias a partir de hoje.`;
  }
  return null;
}

// Instante enviado ao banco: a data escolhida, as 18h no fuso local.
export function dueDateToIso(value: string): string | null {
  const date = parseDateInput(value);
  if (!date) {
    return null;
  }
  date.setHours(RETURN_HOUR, 0, 0, 0);
  return date.toISOString();
}

export function validateComposerTexts(opening: string, closing: string): string | null {
  if (opening.length > BATCH_TEXT_MAX_LENGTH || closing.length > BATCH_TEXT_MAX_LENGTH) {
    return `Abertura e fechamento aceitam até ${BATCH_TEXT_MAX_LENGTH} caracteres cada.`;
  }
  return null;
}

// Motivo de o candidato nao entrar no lote, ou null se pode entrar.
export function checkEligibility(
  candidate: PipelineCandidate,
  type: BatchFeedbackType,
  options: { dueDate: string; now: Date },
): string | null {
  if (type === 'reject') {
    return canReject(candidate.stage) ? null : 'A candidatura já foi encerrada.';
  }

  if (type === 'advance') {
    if (candidate.stage === 'Final') {
      return 'A aprovação é feita individualmente.';
    }
    if (!ADVANCE_STAGES.has(candidate.stage)) {
      return 'Esta etapa não avança em lote.';
    }
    return null;
  }

  if (!UPDATE_STAGES.has(candidate.stage)) {
    return 'Etapa final: sem prazo de retorno.';
  }
  if ((candidate.postponeCount ?? 0) >= MAX_POSTPONES_PER_STAGE) {
    return `Já usou os ${MAX_POSTPONES_PER_STAGE} adiamentos desta etapa.`;
  }
  const newDueAt = dueDateToIso(options.dueDate);
  if (newDueAt && candidate.returnDueAt) {
    const current = new Date(candidate.returnDueAt).getTime();
    if (!Number.isNaN(current) && new Date(newDueAt).getTime() <= current) {
      return `A nova data precisa ser depois do prazo atual (${formatBr(new Date(current))}).`;
    }
  }
  return null;
}

export function firstName(fullName: string): string {
  const name = fullName.trim();
  if (!name || name === 'Candidato(a)') {
    return '';
  }
  return name.split(/\s+/)[0] ?? '';
}

// "{nome}" vira o primeiro nome. Sem nome, some junto com a virgula antes dele.
export function applyName(text: string, name: string): string {
  return name
    ? text.replace(/\{nome\}/g, name)
    : text.replace(/,?\s*\{nome\}/g, '').trim();
}

export interface BatchEntry {
  candidate: PipelineCandidate;
  message: string;
  // Atualizacao: nova data (ISO). Avancou: null.
  newDueAt: string | null;
  // Avancou: proxima etapa. Nao avancou: Rejeitado. Atualizacao: null.
  targetStage: ApplicationStatus | null;
  // Nao avancou: motivo (um dos 5 do N62), gravado em feedbacks.reason_code.
  reasonCode?: ReasonCode | null;
}

export interface ExcludedCandidate {
  candidate: PipelineCandidate;
  reason: string;
}

// Mensagem de um candidato: abertura + corpo (dados do candidato e da vaga) +
// fechamento. Nunca leva numero ou score.
export function buildBatchMessage(input: {
  type: BatchFeedbackType;
  candidate: PipelineCandidate;
  opening: string;
  closing: string;
  dueDate: string;
  now: Date;
  // Nao avancou (N62): motivo escolhido, dados do match e pontos fortes.
  reason?: ReasonCode;
  insights?: MatchInsights;
  includeStrengths?: boolean;
}): string {
  const { candidate } = input;
  const job = candidate.jobTitle?.trim() || 'vaga';
  const name = firstName(candidate.name);

  let body: string;
  if (input.type === 'reject') {
    body = buildRejectionBody({
      reason: input.reason ?? 'better_fit',
      insights: input.insights ?? EMPTY_INSIGHTS,
      jobTitle: job,
      includeStrengths: input.includeStrengths ?? false,
    });
  } else if (input.type === 'update') {
    const date = parseDateInput(input.dueDate);
    const dueText = date ? formatBr(date) : input.dueDate;
    body = `Você segue no processo da vaga ${job}, na etapa ${candidate.stage}. Ainda não temos uma decisão e, para não deixar você sem notícias, o nosso próximo retorno será até ${dueText}.`;
  } else {
    const next = getNextStage(candidate.stage) ?? candidate.stage;
    const nextDue = new Date(input.now.getTime() + SLA_HOURS * 3_600_000);
    body = `Você avançou para a etapa ${next} da vaga ${job}. O nosso próximo retorno será até ${formatBr(nextDue)}.`;
  }

  return [applyName(input.opening, name).trim(), body, applyName(input.closing, name).trim()]
    .filter((part) => part.length > 0)
    .join('\n\n');
}

function targetStageFor(
  type: BatchFeedbackType,
  stage: ApplicationStatus,
): ApplicationStatus | null {
  if (type === 'advance') {
    return getNextStage(stage);
  }
  return type === 'reject' ? 'Rejeitado' : null;
}

// Separa quem entra no lote de quem nao se aplica, e monta a mensagem de cada um.
export function buildBatchPlan(input: {
  type: BatchFeedbackType;
  candidates: PipelineCandidate[];
  opening: string;
  closing: string;
  dueDate: string;
  now: Date;
  // Nao avancou: motivo e dados do match de cada candidatura (chave = id).
  rejection?: {
    reasons: Readonly<Record<string, ReasonCode>>;
    insights: Readonly<Record<string, MatchInsights | undefined>>;
    includeStrengths: boolean;
  };
}): { entries: BatchEntry[]; excluded: ExcludedCandidate[] } {
  const entries: BatchEntry[] = [];
  const excluded: ExcludedCandidate[] = [];
  const newDueAt = input.type === 'update' ? dueDateToIso(input.dueDate) : null;

  for (const candidate of input.candidates) {
    const reason = checkEligibility(candidate, input.type, {
      dueDate: input.dueDate,
      now: input.now,
    });
    if (reason) {
      excluded.push({ candidate, reason });
      continue;
    }
    let reasonCode: ReasonCode | null = null;
    if (input.type === 'reject') {
      reasonCode = input.rejection?.reasons[candidate.id] ?? null;
      if (!reasonCode) {
        excluded.push({ candidate, reason: 'Escolha o motivo do retorno.' });
        continue;
      }
    }
    entries.push({
      candidate,
      message: buildBatchMessage({
        ...input,
        candidate,
        reason: reasonCode ?? undefined,
        insights: input.rejection?.insights[candidate.id],
        includeStrengths: input.rejection?.includeStrengths,
      }),
      newDueAt,
      reasonCode,
      targetStage: targetStageFor(input.type, candidate.stage),
    });
  }

  return { entries, excluded };
}

export function toRequestItem(entry: BatchEntry): BatchRequestItem {
  return entry.newDueAt
    ? {
        application_id: entry.candidate.id,
        kind: 'update',
        message: entry.message,
        new_due_at: entry.newDueAt,
      }
    : {
        application_id: entry.candidate.id,
        kind: 'decision',
        message: entry.message,
        ...(entry.reasonCode ? { reason_code: entry.reasonCode } : {}),
      };
}

// Previa: ate `count` mensagens de candidatos diferentes, com um de cada motivo
// primeiro (para ver como cada grupo le a mensagem).
export function pickPreview(entries: readonly BatchEntry[], count: number): BatchEntry[] {
  const picked: BatchEntry[] = [];
  const seenReasons = new Set<string>();
  for (const entry of entries) {
    const key = entry.reasonCode ?? '';
    if (picked.length < count && !seenReasons.has(key)) {
      seenReasons.add(key);
      picked.push(entry);
    }
  }
  for (const entry of entries) {
    if (picked.length >= count) {
      break;
    }
    if (!picked.includes(entry)) {
      picked.push(entry);
    }
  }
  return picked;
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export type OutcomeStatus = 'sent' | 'email_failed' | 'skipped' | 'failed';

export interface BatchOutcome {
  applicationId: string;
  name: string;
  status: OutcomeStatus;
  detail: string | null;
  // Avancou: se a etapa foi mudada (null = nao se aplica).
  moved: boolean | null;
}

export interface BatchRunDeps {
  send(items: BatchRequestItem[]): Promise<BatchResponse>;
  move(applicationId: string, stage: ApplicationStatus): Promise<void>;
}

function outcomeFromResponse(
  entry: BatchEntry,
  response: BatchResponse | null,
): Pick<BatchOutcome, 'status' | 'detail'> {
  const item = response?.results.find((result) => result.application_id === entry.candidate.id);
  if (!item) {
    return { status: 'failed', detail: 'O servidor não respondeu sobre este candidato.' };
  }
  switch (item.status) {
    case 'sent':
      return { status: 'sent', detail: null };
    case 'skipped_limit':
      return {
        status: 'skipped',
        detail: 'Limite de envios por hora atingido. Tente de novo mais tarde.',
      };
    case 'skipped_duplicate':
      return { status: 'skipped', detail: batchItemErrorLabel(item.error ?? 'already_sent') };
    case 'failed':
      return item.in_app
        ? { status: 'email_failed', detail: batchItemErrorLabel('email_failed') }
        : { status: 'failed', detail: batchItemErrorLabel(item.error) };
  }
}

// Envia em blocos de 25. No "avancou", muda a etapa de quem teve o retorno
// registrado (enviado, ou registrado com falha so no e-mail). Se um bloco falha
// inteiro (sessao, rede), ele e o resto ficam como nao enviados.
export async function runBatchFeedback(
  deps: BatchRunDeps,
  entries: BatchEntry[],
  onProgress?: (done: number, total: number) => void,
): Promise<BatchOutcome[]> {
  const outcomes: BatchOutcome[] = [];
  const blocks = chunk(entries, BATCH_CHUNK_SIZE);

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
    const block = blocks[blockIndex] ?? [];
    let response: BatchResponse | null = null;
    let requestError: string | null = null;

    try {
      response = await deps.send(block.map(toRequestItem));
    } catch (error) {
      requestError = error instanceof Error ? error.message : 'Não foi possível enviar.';
    }

    if (requestError) {
      for (const entry of blocks.slice(blockIndex).flat()) {
        outcomes.push({
          applicationId: entry.candidate.id,
          name: entry.candidate.name,
          status: 'failed',
          detail: requestError,
          moved: entry.targetStage ? false : null,
        });
      }
      onProgress?.(entries.length, entries.length);
      return outcomes;
    }

    for (const entry of block) {
      const base = outcomeFromResponse(entry, response);
      let moved: boolean | null = null;
      let detail = base.detail;

      if (entry.targetStage) {
        moved = false;
        if (base.status === 'sent' || base.status === 'email_failed') {
          try {
            await deps.move(entry.candidate.id, entry.targetStage);
            moved = true;
          } catch {
            detail = `${detail ? `${detail} ` : ''}A etapa não foi alterada.`;
          }
        }
      }

      outcomes.push({
        applicationId: entry.candidate.id,
        name: entry.candidate.name,
        status: base.status,
        detail,
        moved,
      });
    }

    onProgress?.(Math.min((blockIndex + 1) * BATCH_CHUNK_SIZE, entries.length), entries.length);
  }

  return outcomes;
}

export interface OutcomeSummary {
  sent: number;
  emailFailed: number;
  skipped: number;
  failed: number;
  moved: number;
}

export function summarizeOutcomes(outcomes: BatchOutcome[]): OutcomeSummary {
  return {
    sent: outcomes.filter((o) => o.status === 'sent').length,
    emailFailed: outcomes.filter((o) => o.status === 'email_failed').length,
    skipped: outcomes.filter((o) => o.status === 'skipped').length,
    failed: outcomes.filter((o) => o.status === 'failed').length,
    moved: outcomes.filter((o) => o.moved === true).length,
  };
}
