// Logica pura do e-mail transacional (N17). Sem APIs do Deno: roda no vitest.

export const TEMPLATE_NAMES = ['test'] as const;
export type TemplateName = (typeof TEMPLATE_NAMES)[number];

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function isTemplateName(value: unknown): value is TemplateName {
  return typeof value === 'string' && (TEMPLATE_NAMES as readonly string[]).includes(value);
}

export function isValidEmail(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Cada template novo (N15, 6.5) entra aqui e em TEMPLATE_NAMES.
export function renderTemplate(
  name: TemplateName,
  vars: { recipientName?: string } = {},
): RenderedEmail {
  switch (name) {
    case 'test': {
      const who = vars.recipientName?.trim() ? vars.recipientName.trim() : 'recrutador(a)';
      return {
        subject: 'Teste de e-mail do Job Match',
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937"><p>Olá, ${escapeHtml(who)}!</p><p>Este é um e-mail de teste do Job Match. Se você o recebeu, o envio de e-mails está funcionando.</p></div>`,
        text: `Olá, ${who}! Este é um e-mail de teste do Job Match. Se você o recebeu, o envio de e-mails está funcionando.`,
      };
    }
  }
}

export interface ResendPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
}

export function buildResendPayload(
  from: string,
  to: string,
  email: RenderedEmail,
): ResendPayload {
  return { from, to: [to], subject: email.subject, html: email.html, text: email.text };
}

export class EmailSendError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'EmailSendError';
    this.status = status;
  }
}

export type FetchLike = (
  input: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

// Envia pelo Resend. O fetch entra como parametro para poder testar sem rede.
export async function sendWithResend(
  fetchImpl: FetchLike,
  apiKey: string,
  payload: ResendPayload,
): Promise<{ id: string }> {
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const record = (body ?? {}) as { id?: unknown; message?: unknown };

  if (!response.ok) {
    const message = typeof record.message === 'string' ? record.message : 'Falha ao enviar o e-mail.';
    throw new EmailSendError(message, response.status);
  }
  if (typeof record.id !== 'string') {
    throw new EmailSendError('Resposta inesperada do provedor de e-mail.', 502);
  }
  return { id: record.id };
}

// Limite simples por recrutador: no maximo MAX_EMAILS_PER_HOUR envios por hora.
export const MAX_EMAILS_PER_HOUR = 5;

export function isRateLimited(sentInLastHour: number): boolean {
  return sentInLastHour >= MAX_EMAILS_PER_HOUR;
}
