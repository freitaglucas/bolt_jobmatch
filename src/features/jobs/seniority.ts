// Niveis de senioridade da vaga. Os codigos precisam ser iguais aos da
// constraint jobs_seniority_check (supabase/migrations/20261002010000_jobs_seniority.sql).
export const SENIORITY_VALUES = [
  'junior',
  'pleno',
  'senior',
  'especialista',
  'coordenador',
  'gerente',
  'head',
  'diretor',
  'c_level',
] as const;

export type SeniorityValue = (typeof SENIORITY_VALUES)[number];

export const SENIORITY_LABELS: Record<SeniorityValue, string> = {
  junior: 'Junior',
  pleno: 'Pleno',
  senior: 'Senior',
  especialista: 'Especialista',
  coordenador: 'Coordenador',
  gerente: 'Gerente',
  head: 'Head',
  diretor: 'Diretor',
  c_level: 'C-level',
};

// Converte o texto que vem do banco para um nivel valido (ou null).
export function toSeniority(
  value: string | null | undefined,
): SeniorityValue | null {
  return SENIORITY_VALUES.find((level) => level === value) ?? null;
}

export function seniorityLabel(
  value: SeniorityValue | null | undefined,
): string {
  return value ? SENIORITY_LABELS[value] : 'Não informada';
}
