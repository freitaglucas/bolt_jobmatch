// Layout comum dos e-mails ao candidato (N74). Sem APIs do Deno: roda no vitest.
// Cabecalho "Job Match" com o nome da empresa, bloco de etapa e prazo, citacao
// opcional (frase do gestor, preenchida a partir do N85), botao "Ver minha
// candidatura" e rodape padrao. Toda saida tem versao texto equivalente.
import { escapeHtml } from './email-core.ts';

export const BRAND_NAME = 'Job Match';
export const EMAIL_MAX_WIDTH = 600;
export const VIEW_APPLICATION_LABEL = 'Ver minha candidatura';
// Parametro que o app le para abrir direto em Candidaturas (src/lib/deep-link.ts).
export const APPLICATIONS_DEEP_LINK = '?tela=candidaturas';
// Prazo padrao de retorno por etapa (mesmo valor de SLA_HOURS no app).
export const SLA_HOURS = 120;

// Rotulos das etapas (applications.current_stage) como o candidato ve no app.
export const STAGE_LABELS: Record<string, string> = {
  new_application: 'Em análise',
  screening: 'Triagem',
  interview: 'Entrevista',
  final_interview: 'Final',
};

// Etapa seguinte no "avancou" (a aprovacao e feita no fluxo individual).
export const NEXT_STAGE: Record<string, string> = {
  new_application: 'screening',
  screening: 'interview',
  interview: 'final_interview',
};

// Etapas que contam como "alcancadas" (Em analise e o ponto de partida).
const REACHED_STAGES: ReadonlySet<string> = new Set(['screening', 'interview', 'final_interview']);

const BRAND_COLOR = '#5729FF';
const BRAND_SOFT = '#F3F0FF';
const BRAND_TEXT = '#3B2A99';
const HEADER_SUBTEXT = '#E9E3FF';
const TEXT_COLOR = '#1F2937';
const MUTED_COLOR = '#4B5563';
const FONT = 'Arial,Helvetica,sans-serif';

export function singleLine(value: string, maxLength: number): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function firstName(fullName: string | null | undefined): string {
  const name = singleLine(fullName ?? '', 80);
  if (!name || name === 'Candidato(a)') {
    return '';
  }
  return name.split(' ')[0] ?? '';
}

// "Voce chegou a etapa X" so para Triagem, Entrevista e Final; senao null.
export function reachedStageLine(stage: string | null | undefined): string | null {
  if (!stage || !REACHED_STAGES.has(stage)) {
    return null;
  }
  return `Você chegou à etapa ${STAGE_LABELS[stage]}`;
}

// dd/mm no fuso de Sao Paulo (o dia que o candidato ve). null se a data for invalida.
export function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
  });
}

// Prazo padrao a partir de agora (SLA de 5 dias), em ISO.
export function defaultDueAt(now: Date): string {
  return new Date(now.getTime() + SLA_HOURS * 3_600_000).toISOString();
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

// APP_URL valida (https, ou http so em localhost), sem barra no fim. Senao null:
// o e-mail sai sem botao e nao quebra.
export function normalizeAppUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const secure = url.protocol === 'https:' || (url.protocol === 'http:' && isLocalHost(url.hostname));
  if (!secure || url.username || url.password || url.search || url.hash) {
    return null;
  }
  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}

// Link do botao "Ver minha candidatura", ou null sem APP_URL valida.
export function applicationsUrl(appUrl: string | null | undefined): string | null {
  const base = normalizeAppUrl(appUrl);
  return base ? `${base}/${APPLICATIONS_DEEP_LINK}` : null;
}

// Assunto com o prazo quando houver: "<base> · Próximo retorno até dd/mm".
export function subjectWithDue(base: string, dueAt: string | null | undefined): string {
  const due = formatShortDate(dueAt);
  return due ? `${base} · Próximo retorno até ${due}` : base;
}

export interface EmailQuote {
  text: string;
  author?: string | null;
}

export interface CandidateEmailInput {
  subject: string;
  companyName: string | null;
  jobTitle: string;
  // Corpo em texto puro; paragrafos separados por linha em branco.
  body: string;
  // Bloco de status: etapa ("Você chegou à etapa Entrevista") e prazo (ISO).
  stageLine?: string | null;
  dueAt?: string | null;
  // Frase do gestor (N85). Nada preenche ate la.
  quote?: EmailQuote | null;
  // APP_URL configurada; sem ela, sem botao.
  appUrl?: string | null;
}

function paragraphsHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map(
      (block) =>
        `<p style="margin:0 0 14px 0">${escapeHtml(block).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

function footerText(company: string | null, job: string): string {
  const where = company ? `à vaga "${job}" na empresa ${company}` : `à vaga "${job}"`;
  return `Você recebeu este e-mail porque se candidatou ${where}, pelo ${BRAND_NAME}. Para falar com a empresa, responda a este e-mail.`;
}

// Monta o e-mail completo (assunto, HTML e texto) no layout padrao.
export function renderCandidateEmail(input: CandidateEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const company = singleLine(input.companyName ?? '', 80) || null;
  const job = singleLine(input.jobTitle, 120) || 'vaga';
  const subject = singleLine(input.subject, 200);
  const stageLine = input.stageLine ? singleLine(input.stageLine, 120) : null;
  const due = formatShortDate(input.dueAt);
  const dueLine = due ? `Próximo retorno até ${due}` : null;
  const quoteText = input.quote?.text ? singleLine(input.quote.text, 500) : null;
  const quoteAuthor = input.quote?.author ? singleLine(input.quote.author, 80) : null;
  const link = applicationsUrl(input.appUrl);
  const footer = footerText(company, job);
  const preheader = [stageLine, dueLine].filter(Boolean).join(' · ');

  const header =
    `<tr><td style="background:${BRAND_COLOR};padding:20px 24px">` +
    `<div style="font-size:20px;font-weight:bold;color:#FFFFFF">${BRAND_NAME}</div>` +
    (company
      ? `<div style="font-size:14px;color:${HEADER_SUBTEXT};margin-top:4px">${escapeHtml(company)}</div>`
      : '') +
    '</td></tr>';

  const statusBlock =
    stageLine || dueLine
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px 0;background:${BRAND_SOFT};border-left:4px solid ${BRAND_COLOR};border-radius:8px"><tr><td style="padding:14px 16px">` +
        (stageLine
          ? `<div style="font-size:15px;font-weight:bold;color:${TEXT_COLOR}">${escapeHtml(stageLine)}</div>`
          : '') +
        (due
          ? `<div style="font-size:15px;color:${BRAND_TEXT};margin-top:${stageLine ? '4px' : '0'}">Próximo retorno até <strong>${escapeHtml(due)}</strong></div>`
          : '') +
        '</td></tr></table>'
      : '';

  const quoteBlock = quoteText
    ? `<blockquote style="margin:0 0 18px 0;padding:12px 16px;border-left:4px solid #D1D5DB;color:#374151;font-style:italic">${escapeHtml(quoteText)}` +
      (quoteAuthor
        ? `<br><span style="font-style:normal;font-size:13px;color:${MUTED_COLOR}">${escapeHtml(quoteAuthor)}</span>`
        : '') +
      '</blockquote>'
    : '';

  const button = link
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px 0"><tr><td style="border-radius:8px;background:${BRAND_COLOR}"><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:8px">${VIEW_APPLICATION_LABEL}</a></td></tr></table>`
    : '';

  const html =
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>${escapeHtml(subject)}</title></head>` +
    `<body style="margin:0;padding:0;background:#F3F4F6">` +
    (preheader
      ? `<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>`
      : '') +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6"><tr><td align="center" style="padding:24px 12px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:${EMAIL_MAX_WIDTH}px;background:#FFFFFF;border-radius:12px;overflow:hidden;font-family:${FONT};color:${TEXT_COLOR}">` +
    header +
    `<tr><td style="padding:24px;font-size:15px;line-height:1.5">${paragraphsHtml(input.body)}${statusBlock}${quoteBlock}${button}</td></tr>` +
    `<tr><td style="padding:16px 24px;background:#F9FAFB;font-size:12px;line-height:1.5;color:${MUTED_COLOR}">${escapeHtml(footer)}</td></tr>` +
    '</table></td></tr></table></body></html>';

  const textParts = [
    company ? `${BRAND_NAME} · ${company}` : BRAND_NAME,
    input.body.trim(),
    [stageLine, dueLine].filter(Boolean).join('\n'),
    quoteText ? `"${quoteText}"${quoteAuthor ? ` (${quoteAuthor})` : ''}` : '',
    link ? `${VIEW_APPLICATION_LABEL}: ${link}` : '',
    `--\n${footer}`,
  ];

  return {
    subject,
    html,
    text: textParts.filter((part) => part.length > 0).join('\n\n'),
  };
}
