// Regua de nivel de competencia (N30): sempre 3 niveis, para a vaga e para o
// candidato. O banco guarda 1, 2 ou 3 (job_skills.required_level e
// candidate_skills.declared_level). O descritor e a ancora generica de
// autonomia; o exemplo por competencia chega com o catalogo v1 (N41).
export const SKILL_LEVELS = [1, 2, 3] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const MIN_SKILL_LEVEL = 1;
export const MAX_SKILL_LEVEL = 3;

// Nivel padrao ao adicionar uma competencia (vaga e candidato).
export const DEFAULT_SKILL_LEVEL: SkillLevel = 2;

export const SKILL_LEVEL_NAMES: Record<SkillLevel, string> = {
  1: 'Básico',
  2: 'Intermediário',
  3: 'Avançado',
};

export const SKILL_LEVEL_DESCRIPTORS: Record<SkillLevel, string> = {
  1: 'Já aplicou com orientação ou em tarefas simples; ainda precisa de apoio fora do comum.',
  2: 'Aplica com autonomia no dia a dia e resolve sozinho(a) os problemas comuns.',
  3: 'Resolve problemas complexos, decide como fazer e orienta outras pessoas.',
};

// Converte qualquer numero para um nivel valido (1 a 3), arredondando.
export function toSkillLevel(level: number): SkillLevel {
  if (!Number.isFinite(level) || level <= MIN_SKILL_LEVEL) {
    return 1;
  }
  if (level >= MAX_SKILL_LEVEL) {
    return 3;
  }
  return Math.round(level) as SkillLevel;
}

export function skillLevelName(level: number): string {
  return SKILL_LEVEL_NAMES[toSkillLevel(level)];
}

export function skillLevelDescriptor(level: number): string {
  return SKILL_LEVEL_DESCRIPTORS[toSkillLevel(level)];
}
