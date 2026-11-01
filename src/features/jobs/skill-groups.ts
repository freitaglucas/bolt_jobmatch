import type { JobItemRole } from './item-roles';

// Grupo de alternativas montado na criacao da vaga (N33). A chave e local da
// tela; o id do banco nasce na gravacao.
export interface DraftGroup {
  key: string;
  minCount: number;
  role: JobItemRole;
}

export interface GroupableItem {
  skillId: string;
  groupKey?: string;
}

export const MAX_GROUP_MIN = 10;

export function groupMembers<T extends GroupableItem>(items: readonly T[], key: string): T[] {
  return items.filter((item) => item.groupKey === key);
}

export function nextGroupKey(groups: readonly DraftGroup[]): string {
  let index = groups.length + 1;
  while (groups.some((group) => group.key === `g${index}`)) {
    index += 1;
  }
  return `g${index}`;
}

// Opcoes do "basta ter": de 1 ate um a menos que o tamanho do grupo.
export function minOptions(size: number): number[] {
  const top = Math.min(Math.max(size - 1, 1), MAX_GROUP_MIN);
  return Array.from({ length: top }, (_, index) => index + 1);
}

// Mensagem do primeiro problema dos grupos, ou null se esta tudo certo.
export function validateGroups(
  items: readonly GroupableItem[],
  groups: readonly DraftGroup[],
): string | null {
  const keys = new Set(groups.map((group) => group.key));
  if (items.some((item) => item.groupKey !== undefined && !keys.has(item.groupKey))) {
    return 'Um item está num grupo de alternativas que não existe mais.';
  }
  for (const [index, group] of groups.entries()) {
    const size = groupMembers(items, group.key).length;
    if (size < 2) {
      return `O grupo de alternativas ${index + 1} precisa de pelo menos 2 itens.`;
    }
    if (group.minCount < 1 || group.minCount >= size) {
      return `No grupo de alternativas ${index + 1}, o mínimo precisa ser menor que o número de itens.`;
    }
  }
  return null;
}

// "Basta 1 de 3" (texto curto da tela).
export function groupRuleText(minCount: number, size: number): string {
  return `Basta ${minCount} de ${size}`;
}
