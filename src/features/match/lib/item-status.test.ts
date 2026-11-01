import { describe, expect, it } from 'vitest';
import { displayOrder, groupHint, summarizeItems } from './item-status';

describe('summarizeItems', () => {
  it('sem grupo, conta item por item', () => {
    expect(
      summarizeItems([
        { required: 2, declared: 2 },
        { required: 3, declared: 1 },
        { required: 2, declared: 0 },
      ]),
    ).toEqual({ counts: { match: 1, gap: 1, missing: 1 }, statuses: ['match', 'gap', 'missing'] });
  });

  it('grupo atendido conta uma vez e o item que falta vira alternativa', () => {
    const result = summarizeItems([
      { required: 2, declared: 0, groupId: 'g1', groupMin: 1 },
      { required: 2, declared: 2, groupId: 'g1', groupMin: 1 },
      { required: 2, declared: 0, groupId: 'g1', groupMin: 1 },
      { required: 2, declared: 0 },
    ]);
    expect(result.counts).toEqual({ match: 1, gap: 0, missing: 1 });
    expect(result.statuses).toEqual(['alternative', 'match', 'alternative', 'missing']);
  });

  it('grupo com item abaixo do nivel conta como gap', () => {
    const result = summarizeItems([
      { required: 3, declared: 1, groupId: 'g1', groupMin: 1 },
      { required: 3, declared: 0, groupId: 'g1', groupMin: 1 },
    ]);
    expect(result.counts).toEqual({ match: 0, gap: 1, missing: 0 });
    expect(result.statuses).toEqual(['gap', 'alternative']);
  });

  it('grupo sem itens suficientes conta como ausente', () => {
    const result = summarizeItems([
      { required: 2, declared: 2, groupId: 'g1', groupMin: 2 },
      { required: 2, declared: 0, groupId: 'g1', groupMin: 2 },
      { required: 2, declared: 0, groupId: 'g1', groupMin: 2 },
    ]);
    expect(result.counts).toEqual({ match: 0, gap: 0, missing: 1 });
    expect(result.statuses).toEqual(['match', 'missing', 'missing']);
  });
});

describe('groupHint', () => {
  it('fala com o candidato sem numero de score', () => {
    expect(groupHint(1, 3)).toBe('Vale qualquer 1 de 3');
    expect(groupHint(2, 4)).toBe('Valem 2 de 4');
  });
});

describe('displayOrder', () => {
  it('junta os itens do mesmo grupo na posicao do primeiro', () => {
    expect(
      displayOrder([{ groupId: null }, { groupId: 'g1' }, { groupId: null }, { groupId: 'g1' }]),
    ).toEqual([0, 1, 3, 2]);
  });
});
