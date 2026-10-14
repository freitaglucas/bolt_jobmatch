// Aviso de mudanca de etapa (N71). Sem APIs do Deno: roda no vitest.
// Quando o recrutador avanca um candidato, a tela pede este aviso: o texto e
// montado aqui (sem texto livre) e o e-mail sai como "<Empresa> via Job Match".
import { buildFromHeader, type LogResult } from './batch-feedback.ts';
import {
  escapeHtml,
  isValidEmail,
  type RenderedEmail,
  type ResendPayload,
} from './email-core.ts';

// Teto de seguranca por recrutador, por hora.
export const MAX_STAGE_UPDATES_PER_HOUR = 300;

// Etapas (applications.current_stage) para onde um candidato "avanca". Aprovado
// e Rejeitado nao usam este aviso: tem retorno proprio.
export const NOTICE_STAGE_LABELS: Record<string, string> = {
  screening: 'Triagem',
  interview: 'Entrevista',
  final_interview: 'Final',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// application_id valido (minusculo) ou null.
export function parseStageUpdateRequest(raw: unknown): string | null {
  return typeof raw === 'string' && UUID_RE.test(raw) ? raw.toLowerCase() : null;
}

function singleLine(value: string, maxLength: number): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function firstName(fullName: string | null): string {
  return singleLine(fullName ?? '', 80).split(' ')[0] ?? '';
}

// dd/mm/aaaa no fuso de Sao Paulo (o prazo e o dia que o candidato ve).
export function formatNoticeDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function renderStageUpdateEmail(input: {
  candidateName: string | null;
  companyName: string | null;
  jobTitle: string;
  stageLabel: string;
  dueAt: string | null;
}): RenderedEmail {
  const company = singleLine(input.companyName ?? '', 80) || 'a empresa';
  const job = singleLine(input.jobTitle, 120) || 'vaga';
  const name = firstName(input.candidateName);
  const greeting = name ? `Olá, ${name}!` : 'Olá!';
  const dueDate = input.dueAt && !Number.isNaN(new Date(input.dueAt).getTime())
    ? formatNoticeDate(input.dueAt)
    : null;
  const body =
    `Você avançou para a etapa ${input.stageLabel} da vaga ${job}.` +
    (dueDate ? ` Próximo retorno até ${dueDate}.` : '');
  const footer = `Aviso automático enviado por ${company} pelo Job Match, plataforma onde você se candidatou à vaga "${job}". Você pode responder a este e-mail para falar com a empresa.`;

  return {
    subject: `Você avançou no processo: ${job}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f2937"><p style="margin:0 0 14px 0">${escapeHtml(greeting)}</p><p style="margin:0 0 14px 0">${escapeHtml(body)}</p><p style="margin:24px 0 0 0;font-size:12px;color:#6b7280">${escapeHtml(footer)}</p></div>`,
    text: `${greeting}\n\n${body}\n\n--\n${footer}`,
  };
}

export interface StageUpdateApplication {
  id: string;
  stage: string;
  candidateId: string;
  candidateName: string | null;
  jobTitle: string;
  companyName: string | null;
}

export interface StageUpdateDeps {
  // Candidatura da vaga do recrutador, ou null se nao existir / nao for dele.
  loadApplication(applicationId: string, recruiterId: string): Promise<StageUpdateApplication | null>;
  // Prazo de retorno aberto da candidatura (ISO), ou null.
  loadOpenDueAt(applicationId: string): Promise<string | null>;
  getCandidateEmail(candidateId: string): Promise<string | null>;
  // Reserva o aviso no email_log (pending). 'duplicate' = ja reservado ou enviado nesta etapa.
  claimLog(entry: {
    recruiterId: string;
    toEmail: string;
    applicationId: string;
    stage: string;
  }): Promise<{ id: string } | 'duplicate'>;
  send(payload: ResendPayload): Promise<{ id: string }>;
  finishLog(id: string, result: LogResult): Promise<void>;
}

export interface StageUpdateContext {
  recruiterId: string;
  recruiterEmail: string | null;
  from: string;
}

export type StageUpdateStatus = 'sent' | 'failed' | 'skipped_duplicate' | 'skipped';

export interface StageUpdateResult {
  status: StageUpdateStatus;
  error?: string;
}

function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : 'unknown').slice(0, 300);
}

// Confere a candidatura -> reserva o aviso -> envia. O aviso nunca desfaz nem
// atrasa a mudanca de etapa: quem chama ja mudou a etapa antes de pedir.
export async function processStageUpdate(
  deps: StageUpdateDeps,
  context: StageUpdateContext,
  applicationId: string,
): Promise<StageUpdateResult> {
  const application = await deps.loadApplication(applicationId, context.recruiterId);
  if (!application) {
    return { status: 'failed', error: 'application_not_found' };
  }

  const stageLabel = NOTICE_STAGE_LABELS[application.stage];
  if (!stageLabel) {
    return { status: 'skipped', error: 'stage_without_notice' };
  }

  const toEmail = await deps.getCandidateEmail(application.candidateId);
  if (!isValidEmail(toEmail)) {
    return { status: 'failed', error: 'no_recipient' };
  }

  const claim = await deps.claimLog({
    recruiterId: context.recruiterId,
    toEmail,
    applicationId,
    stage: application.stage,
  });
  if (claim === 'duplicate') {
    return { status: 'skipped_duplicate', error: 'already_sent' };
  }

  try {
    const email = renderStageUpdateEmail({
      candidateName: application.candidateName,
      companyName: application.companyName,
      jobTitle: application.jobTitle,
      stageLabel,
      dueAt: await deps.loadOpenDueAt(applicationId),
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
    return { status: 'sent' };
  } catch (error) {
    await deps.finishLog(claim.id, { status: 'failed', error: errorText(error) });
    return { status: 'failed', error: 'email_failed' };
  }
}
