import type { SkillOption } from './api';

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export interface SkillSearchResult {
  items: SkillOption[];
  total: number;
}

// Filtra o catálogo pelo texto digitado (sem diferenciar acentos nem maiúsculas),
// esconde as competências já escolhidas e limita quantas aparecem na tela.
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
      (category === null || skill.category === category) &&
      (normalizedQuery === '' || normalizeText(skill.name).includes(normalizedQuery)),
  );

  return { items: matches.slice(0, limit), total: matches.length };
}
