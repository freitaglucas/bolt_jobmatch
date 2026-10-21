// Origem do candidato pelo link da vaga (N84). O recrutador divulga
// <app>/?vaga=<id>; a vaga so abre para quem esta logado, entao a origem fica
// guardada neste navegador ate o cadastro, o perfil e a candidatura.
// Guarda so o id da vaga e a data, nunca dado de pessoa.

export const JOB_LINK_PARAM = 'vaga';
export const JOB_LINK_STORAGE_KEY = 'job-match-job-link-origin';
// A origem vale por 7 dias (tempo para confirmar o e-mail e completar o perfil).
export const JOB_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface JobLinkOrigin {
  jobId: string;
  at: number;
}

export interface FunnelSourceMetadata {
  source: 'job_link' | 'direct';
  source_job_id?: string;
}

function params(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

// id da vaga do link (minusculo), ou null.
export function readJobLinkParam(search: string): string | null {
  const value = params(search).get(JOB_LINK_PARAM)?.trim() ?? '';
  return UUID_RE.test(value) ? value.toLowerCase() : null;
}

// Endereco sem o parametro "vaga" (recarregar a pagina nao repete a origem).
export function stripJobLinkParam(pathname: string, search: string, hash: string): string {
  const rest = params(search);
  rest.delete(JOB_LINK_PARAM);
  const query = rest.toString();
  return `${pathname}${query ? `?${query}` : ''}${hash}`;
}

// Link que o recrutador divulga.
export function buildJobLink(appOrigin: string, jobId: string): string {
  return `${appOrigin.replace(/\/+$/, '')}/?${JOB_LINK_PARAM}=${encodeURIComponent(jobId)}`;
}

export function parseStoredOrigin(raw: string | null, now: number): JobLinkOrigin | null {
  if (!raw) {
    return null;
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  const record = (value ?? {}) as { jobId?: unknown; at?: unknown };
  if (typeof record.jobId !== 'string' || !UUID_RE.test(record.jobId)) {
    return null;
  }
  if (typeof record.at !== 'number' || now - record.at > JOB_LINK_TTL_MS || record.at > now) {
    return null;
  }
  return { jobId: record.jobId.toLowerCase(), at: record.at };
}

export function funnelSource(origin: JobLinkOrigin | null): FunnelSourceMetadata {
  return origin ? { source: 'job_link', source_job_id: origin.jobId } : { source: 'direct' };
}

// Coloca a vaga do link na frente da lista (se ela estiver na lista).
export function prioritizeJob<T extends { id: string }>(jobs: T[], jobId: string | null | undefined): T[] {
  if (!jobId) {
    return jobs;
  }
  const index = jobs.findIndex((job) => job.id === jobId);
  if (index <= 0) {
    return jobs;
  }
  return [jobs[index] as T, ...jobs.slice(0, index), ...jobs.slice(index + 1)];
}

// Armazenamento local: pode falhar (aba anonima, bloqueio); nunca quebra a tela.
export function saveJobLinkOrigin(jobId: string, now: number = Date.now()): void {
  try {
    localStorage.setItem(JOB_LINK_STORAGE_KEY, JSON.stringify({ jobId, at: now }));
  } catch {
    // sem armazenamento: o funil registra "direct"
  }
}

export function loadJobLinkOrigin(now: number = Date.now()): JobLinkOrigin | null {
  try {
    return parseStoredOrigin(localStorage.getItem(JOB_LINK_STORAGE_KEY), now);
  } catch {
    return null;
  }
}

export function clearJobLinkOrigin(): void {
  try {
    localStorage.removeItem(JOB_LINK_STORAGE_KEY);
  } catch {
    // nada a limpar
  }
}
