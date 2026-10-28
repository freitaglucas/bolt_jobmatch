// Tipos de item do catalogo (N31). Precisam ser iguais ao check
// skills_kind_check (migration 20261027020000_item_types_requirements.sql).
export const ITEM_KINDS = ['competency', 'tool', 'requirement', 'trait'] as const;

export type ItemKind = (typeof ITEM_KINDS)[number];

// So competencia e ferramenta pontuam (entram em job_skills e candidate_skills).
// Requisito filtra antes do score; ponto forte (trait) nunca pontua.
export const SCORED_KINDS = ['competency', 'tool'] as const satisfies readonly ItemKind[];

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  competency: 'Competência',
  tool: 'Ferramenta',
  requirement: 'Requisito',
  trait: 'Ponto forte',
};

export function isItemKind(value: unknown): value is ItemKind {
  return typeof value === 'string' && (ITEM_KINDS as readonly string[]).includes(value);
}

export function isScoredKind(kind: string): boolean {
  return (SCORED_KINDS as readonly string[]).includes(kind);
}