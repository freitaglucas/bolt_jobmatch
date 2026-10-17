import { SLA_HOURS } from '../tokens/token-rules';

// Espelham return_seal_min_returns() e return_seal_window_days() do banco
// (N65); o teste seal-rules.test.ts trava os valores.
export const SEAL_MIN_RETURNS = 30;
export const SEAL_WINDOW_DAYS = 90;

// Linha de public_return_seals(): so existe quando o selo foi conquistado.
export interface SealRow {
  job_id: string;
  seal_percent: number;
}

// Promessa fixa da plataforma, mostrada em toda vaga (com ou sem selo).
export function returnPromiseText(): string {
  const days = SLA_HOURS / 24;
  return `Retorno em até ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

export function sealText(percent: number): string {
  return `${percent}% dos candidatos receberam retorno no prazo`;
}

export function sealPeriodText(): string {
  return `Últimos ${SEAL_WINDOW_DAYS} dias`;
}

// Mapa vaga -> percentual. Ignora linhas invalidas (nunca mostra selo duvidoso).
export function sealsByJob(rows: readonly SealRow[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    if (
      typeof row.job_id === 'string' &&
      Number.isFinite(row.seal_percent) &&
      row.seal_percent >= 0 &&
      row.seal_percent <= 100
    ) {
      result[row.job_id] = Math.floor(row.seal_percent);
    }
  }
  return result;
}
