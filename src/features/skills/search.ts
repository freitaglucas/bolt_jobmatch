import type { SkillOption } from './api';

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Grupo do item na lista da vaga (N31): ferramenta, ou competencia tecnica
// (hard) ou comportamental (soft).
export type SkillGroup = 'hard' | 'soft' | 'tool';

export function skillGroup(skill: SkillOption): SkillGroup {
  if (skill.kind === 'tool') {
    return 'tool';
  }
  return skill.category === 'soft' ? 'soft' : 'hard';
}

export const SKILL_GROUP_LABELS: Record<SkillGroup, string> = {
  hard: 'Técnica',
  soft: 'Comportamental',
  tool: 'Ferramenta',
};

export interface SkillSearchResult {
  items: SkillOption[];
  total: number;
}

// Filtra o catálogo pelo texto digitado (sem diferenciar acentos nem maiúsculas),
// esconde as competências já escolhidas, filtra pelo grupo (técnica,
// comportamental ou ferramenta) e limita quantas aparecem na tela.
export function filterSkills(
  skills: SkillOption[],
  query: string,
  excludeIds: string[],
  limit: number,
  category: string | null = null,
): SkillSearchResult {
  const normalizedQuery = normalizeText(query);
  const excluded = new Set(excludeIds);

  const matches = skills.filter(
    (skill) =>
      !excluded.has(skill.id) &&
      (category === null || skillGroup(skill) === category) &&
      (normalizedQuery === '' || normalizeText(skill.name).includes(normalizedQuery)),
  );

  return { items: matches.slice(0, limit), total: matches.length };
}
