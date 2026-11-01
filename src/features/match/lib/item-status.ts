// Status de cada item da vaga para o candidato (compativel, gap, ausente), com
// grupos de alternativas (N33): o grupo conta como um item nos totais, e o item
// que falta dentro de um grupo ja atendido aparece como "alternativa", nao como
// ausente.

export interface StatusItem {
  required: number;
  declared: number;
  groupId?: string | null;
  groupMin?: number;
}

export type ItemStatus = 'match' | 'gap' | 'missing' | 'alternative';

export interface ItemSummary {
  counts: { match: number; gap: number; missing: number };
  statuses: ItemStatus[];
}

function ownStatus(item: StatusItem): 'match' | 'gap' | 'missing' {
  if (item.declared <= 0) {
    return 'missing';
  }
  return item.declared >= item.required ? 'match' : 'gap';
}

export function summarizeItems(items: readonly StatusItem[]): ItemSummary {
  const counts = { match: 0, gap: 0, missing: 0 };
  const statuses: ItemStatus[] = items.map(ownStatus);

  const groups = new Map<string, number[]>();
  items.forEach((item, index) => {
    if (item.groupId) {
      const current = groups.get(item.groupId) ?? [];
      current.push(index);
      groups.set(item.groupId, current);
    } else {
      counts[ownStatus(item)] += 1;
    }
  });

  for (const indexes of groups.values()) {
    const members = indexes.map((index) => items[index] as StatusItem);
    const needed = Math.min(
      Math.max(1, ...members.map((member) => member.groupMin ?? 1)),
      members.length,
    );
    const atLevel = members.filter((member) => ownStatus(member) === 'match').length;
    const present = members.filter((member) => member.declared > 0).length;
    const unit = atLevel >= needed ? 'match' : present >= needed ? 'gap' : 'missing';
    counts[unit] += 1;
    if (unit !== 'missing') {
      for (const index of indexes) {
        if (statuses[index] === 'missing') {
          statuses[index] = 'alternative';
        }
      }
    }
  }

  return { counts, statuses };
}

// Texto curto do grupo para o candidato: "Vale qualquer 1 de 3".
export function groupHint(min: number, size: number): string {
  return min === 1 ? `Vale qualquer 1 de ${size}` : `Valem ${min} de ${size}`;
}

// Ordem de exibicao: itens do mesmo grupo ficam juntos, na posicao do primeiro.
export function displayOrder(items: readonly Pick<StatusItem, 'groupId'>[]): number[] {
  const order: number[] = [];
  const placed = new Set<number>();
  items.forEach((item, index) => {
    if (placed.has(index)) {
      return;
    }
    if (!item.groupId) {
      order.push(index);
      placed.add(index);
      return;
    }
    items.forEach((other, otherIndex) => {
      if (other.groupId === item.groupId && !placed.has(otherIndex)) {
        order.push(otherIndex);
        placed.add(otherIndex);
      }
    });
  });
  return order;
}
