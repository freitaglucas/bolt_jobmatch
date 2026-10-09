// Retorno em lote ao candidato (N15a). Sem APIs do Deno: roda no vitest.
// As regras puras (validacao, remetente, texto do e-mail) e a orquestracao do
// lote ficam aqui; o index.ts da send-email so liga as dependencias reais.
import {
  escapeHtml,
  isValidEmail,
  type RenderedEmail,
  type ResendPayload,
} from './email-core.ts';

export const MAX_BATCH_ITEMS = 25;
export const MIN_MESSAGE_LENGTH = 10;
export const MAX_DECISION_MESSAGE_LENGTH = 1500;
// postpone_feedback aceita ate 1000 caracteres.
export const MAX_UPDATE_MESSAGE_LENGTH = 1000;
// Teto de seguranca por recrutador (o token nao limita o lote).
export const MAX_BATCH_EMAILS_PER_HOUR = 300;

export const REASON_CODES = [
  'missing_required',
  'level_below',
  'eliminatory',
  'better_fit',
  'job_closed',
] as const;
export type ReasonCode = (typeof REASON_CODES)[number];
export type FeedbackKind = 'decision' | 'update';

export interface BatchItem {
  applicationId: string;
  kind: FeedbackKind;
  reasonCode: ReasonCode | null;
  message: string;
  newDueAt: string | null;
}

export type ItemStatus = 'sent' | 'failed' | 'skipped_duplicate' | 'skipped_limit';

export interface ItemResult {
  application_id: string | null;
  status: ItemStatus;
  error?: string;
  // true quando o retorno ja ficou registrado no app (linha do tempo), mesmo que o e-mail tenha falhado.
  in_app?: boolean;
}

export interface BatchSummary {
  sent: number;
  failed: number;
  skipped_duplicate: number;
  skipped_limit: number;
  results: ItemResult[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isReasonCode(value: unknown): value is ReasonCode {
  return typeof value === 'string' && (REASON_CODES as readonly string[]).includes(value);
}

export type ParseResult =
  | { ok: true; items: BatchItem[]; rejected: ItemResult[] }
  | { ok: false; error: 'invalid_items' | 'too_many_items' };

function parseItem(raw: unknown): BatchItem | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const applicationId = record.application_id;
  const kind = record.kind;
  if (typeof applicationId !== 'string' || !UUID_RE.test(applicationId)) {
    return null;
  }
  if (kind !== 'decision' && kind !== 'update') {
    return null;
  }
  if (typeof record.message !== 'string') {
    return null;
  }
  const message = record.message.replace(/\r\n?/g, '\n').trim();
  const maxLength = kind === 'update' ? MAX_UPDATE_MESSAGE_LENGTH : MAX_DECISION_MESSAGE_LENGTH;
  if (message.length < MIN_MESSAGE_LENGTH || message.length > maxLength) {
    return null;
  }

  if (kind === 'update') {
    // Atualizacao honesta: precisa de nova data e nao leva motivo.
    const newDueAt = record.new_due_at;
    if (typeof newDueAt !== 'string' || Number.isNaN(new Date(newDueAt).getTime())) {
      return null;
    }
    if (record.reason_code !== undefined && record.reason_code !== null) {
      return null;
    }
    return {
      applicationId: applicationId.toLowerCase(),
      kind,
      reasonCode: null,
      message,
      newDueAt: new Date(newDueAt).toISOString(),
    };
  }

  // Decisao: motivo opcional (um dos 5 do N62); sem nova data.
  const reason = record.reason_code ?? null;
  if (reason !== null && !isReasonCode(reason)) {
    return null;
  }
  if (record.new_due_at !== undefined && record.new_due_at !== null) {
    return null;
  }
  return {
    applicationId: applicationId.toLowerCase(),
    kind,
    reasonCode: reason,
    message,
    newDueAt: null,
  };
}

// Valida o corpo do lote. Erro de formato do lote inteiro = ok:false (HTTP 400).
// Item ruim ou repetido no lote nao derruba os outros: vai para "rejected".
export function parseBatchItems(raw: unknown): ParseResult {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: 'invalid_items' };
  }
  if (raw.length > MAX_BATCH_ITEMS) {
    return { ok: false, error: 'too_many_items' };
  }

  const items: BatchItem[] = [];
  const rejected: ItemResult[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    const item = parseItem(entry);
    if (!item) {
      const id = (entry as { application_id?: unknown } | null)?.application_id;
      rejected.push({
        application_id: typeof id === 'string' ? id : null,
        status: 'failed',
        error: 'invalid_item',
      });
      continue;
    }
    if (seen.has(item.applicationId)) {
      rejected.push({
        application_id: item.applicationId,
        status: 'skipped_duplicate',
        error: 'duplicate_in_batch',
      });
      continue;
    }
    seen.add(item.applicationId);
    items.push(item);
  }

  return { ok: true, items, rejected };
}

function singleLine(value: string, maxLength: number): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

// Remetente "<Empresa> via Job Match <avisos@dominio>". O endereco vem do
// EMAIL_FROM configurado; o nome de exibicao e limpo para nao quebrar o cabecalho.
export function buildFromHeader(configuredFrom: string, companyName: string | null): string {
  const match = /<([^>]+)>/.exec(configuredFrom);
  const address = (match?.[1] ?? configuredFrom).trim();
  if (!isValidEmail(address)) {
    return configuredFrom;
  }
  const company = singleLine((companyName ?? '').replace(/["<>@,;:\\]/g, ''), 60);
  const display = company ? `${company} via Job Match` : 'Job Match';
  return `"${display}" <${address}>`;
}

function toParagraphsHtml(message: string): string {
  return message
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map(
      (block) =>
        `<p style="margin:0 0 14px 0">${escapeHtml(block).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

// E-mail do retorno em lote. O texto vem pronto da tela (cada candidato tem a
// propria mensagem); aqui so se acrescenta o rodape.
export function renderBatchFeedbackEmail(input: {
  kind: FeedbackKind;
  companyName: string | null;
  jobTitle: string;
  message: string;
}): RenderedEmail {
  const company = singleLine(input.companyName ?? '', 80) || 'a empresa';
  const job = singleLine(input.jobTitle, 120) || 'vaga';
  const subject =
    input.kind === 'update'
      ? `Atualização sobre a sua candidatura: ${job}`
      : `Retorno sobre a sua candidatura: ${job}`;
  const footer = `Mensagem enviada por ${company} pelo Job Match, plataforma onde você se candidatou à vaga "${job}". Você pode responder a este e-mail para falar com a empresa.`;

  return {
    subject,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f2937">${toParagraphsHtml(input.message)}<p style="margin:24px 0 0 0;font-size:12px;color:#6b7280">${escapeHtml(footer)}</p></div>`,
    text: `${input.message}\n\n--\n${footer}`,
  };
}

export interface ApplicationInfo {
  id: string;
  stage: string;
  candidateId: string;
  jobTitle: string;
  companyName: string | null;
}

export interface ClaimEntry {
  recruiterId: string;
  toEmail: string;
  applicationId: string;
  stage: string;
  kind: FeedbackKind;
}

export type LogResult =
  | { status: 'sent'; providerId: string }
  | { status: 'failed'; error: string };

export interface BatchDeps {
  // Candidatura da vaga do recrutador, ou null se nao existir / nao for dele.
  loadApplication(applicationId: string, recruiterId: string): Promise<ApplicationInfo | null>;
  getCandidateEmail(candidateId: string): Promise<string | null>;
  // Reserva o envio no email_log (status pending). 'duplicate' = a decisao ja foi reservada ou enviada.
  claimLog(entry: ClaimEntry): Promise<{ id: string } | 'duplicate'>;
  // Registra o retorno no app (feedbacks + prazo). Lancam Error(codigo) se o banco recusar.
  recordDecision(input: { applicationId: string; message: string; reasonCode: ReasonCode | null }): Promise<void>;
  recordUpdate(input: { applicationId: string; message: string; newDueAt: string }): Promise<void>;
  send(payload: ResendPayload): Promise<{ id: string }>;
  finishLog(id: string, result: LogResult): Promise<void>;
  pause?(): Promise<void>;
}

export interface BatchContext {
  recruiterId: string;
  recruiterEmail: string | null;
  from: string;
  // Quantos envios ainda cabem na hora (MAX_BATCH_EMAILS_PER_HOUR menos o ja enviado).
  quota: number;
}

function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : 'unknown').slice(0, 300);
}

// Ordem por candidato: confere a candidatura -> reserva o envio -> registra o
// retorno no app (cumpre o prazo) -> envia o e-mail. O retorno no app e a fonte da
// verdade; se so o e-mail falhar, o item fica "failed" com in_app = true.
export async function processBatch(
  deps: BatchDeps,
  context: BatchContext,
  items: BatchItem[],
  rejected: ItemResult[] = [],
): Promise<BatchSummary> {
  const results: ItemResult[] = [...rejected];
  let quota = context.quota;

  for (const item of items) {
    if (quota <= 0) {
      results.push({ application_id: item.applicationId, status: 'skipped_limit' });
      continue;
    }

    const application = await deps.loadApplication(item.applicationId, context.recruiterId);
    if (!application) {
      results.push({
        application_id: item.applicationId,
        status: 'failed',
        error: 'application_not_found',
      });
      continue;
    }

    const toEmail = await deps.getCandidateEmail(application.candidateId);
    if (!isValidEmail(toEmail)) {
      results.push({ application_id: item.applicationId, status: 'failed', error: 'no_recipient' });
      continue;
    }

    const claim = await deps.claimLog({
      recruiterId: context.recruiterId,
      toEmail,
      applicationId: item.applicationId,
      stage: application.stage,
      kind: item.kind,
    });
    if (claim === 'duplicate') {
      results.push({
        application_id: item.applicationId,
        status: 'skipped_duplicate',
        error: 'already_sent',
      });
      continue;
    }
    quota -= 1;

    try {
      if (item.kind === 'update' && item.newDueAt) {
        await deps.recordUpdate({
          applicationId: item.applicationId,
          message: item.message,
          newDueAt: item.newDueAt,
        });
      } else {
        await deps.recordDecision({
          applicationId: item.applicationId,
          message: item.message,
          reasonCode: item.reasonCode,
        });
      }
    } catch (error) {
      const text = errorText(error);
      await deps.finishLog(claim.id, { status: 'failed', error: `record_failed: ${text}` });
      results.push({
        application_id: item.applicationId,
        status: 'failed',
        error: text,
        in_app: false,
      });
      continue;
    }

    try {
      const email = renderBatchFeedbackEmail({
        kind: item.kind,
        companyName: application.companyName,
        jobTitle: application.jobTitle,
        message: item.message,
      });
      const result = await deps.send({
        from: buildFromHeader(context.from, application.companyName),
        to: [toEmail],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(context.recruiterEmail && isValidEmail(context.recruiterEmail)
          ? { reply_to: context.recruiterEmail }
          : {}),
      });
      await deps.finishLog(claim.id, { status: 'sent', providerId: result.id });
      results.push({ application_id: item.applicationId, status: 'sent', in_app: true });
    } catch (error) {
      await deps.finishLog(claim.id, { status: 'failed', error: errorText(error) });
      results.push({
        application_id: item.applicationId,
        status: 'failed',
        error: 'email_failed',
        in_app: true,
      });
    }

    await deps.pause?.();
  }

  const count = (status: ItemStatus) => results.filter((r) => r.status === status).length;
  return {
    sent: count('sent'),
    failed: count('failed'),
    skipped_duplicate: count('skipped_duplicate'),
    skipped_limit: count('skipped_limit'),
    results,
  };
}
