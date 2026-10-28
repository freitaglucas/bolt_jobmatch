// Importancia de cada competencia da vaga, que vira job_skills.weight.
// N35 (28/10): a importancia saiu da tela; o papel na vaga decide o peso. Vaga
// nova grava peso 1 (Alta). Vagas antigas guardam o peso que tinham ate a
// formula v2 (N32), que passa a usar o papel (obrigatorio 1,0, implicito 0,5,
// desejavel ate +15%).
export const IMPORTANCE_VALUES = ['high', 'medium', 'low'] as const;

export type ImportanceValue = (typeof IMPORTANCE_VALUES)[number];

export const IMPORTANCE_WEIGHTS: Record<ImportanceValue, number> = {
  high: 1,
  medium: 0.75,
  low: 0.5,
};

export const IMPORTANCE_LABELS: Record<ImportanceValue, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export const DEFAULT_IMPORTANCE: ImportanceValue = 'high';

export function weightForImportance(
  importance?: ImportanceValue | null,
): number {
  return IMPORTANCE_WEIGHTS[importance ?? DEFAULT_IMPORTANCE];
}
