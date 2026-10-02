// Importancia de cada competencia da vaga. Ela vira o "peso" (job_skills.weight)
// usado no Match Score. O padrao e Alta (peso 1), que e o comportamento anterior.
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
