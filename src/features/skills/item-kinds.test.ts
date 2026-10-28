import { describe, expect, it } from 'vitest';
import { ITEM_KINDS, ITEM_KIND_LABELS, SCORED_KINDS, isItemKind, isScoredKind } from './item-kinds';

describe('tipos de item', () => {
  it('tem os quatro tipos do banco, com rotulo em portugues', () => {
    expect(ITEM_KINDS).toEqual(['competency', 'tool', 'requirement', 'trait']);
    expect(ITEM_KINDS.map((kind) => ITEM_KIND_LABELS[kind])).toEqual([
      'Competência',
      'Ferramenta',
      'Requisito',
      'Ponto forte',
    ]);
  });

  it('so competencia e ferramenta pontuam', () => {
    expect(SCORED_KINDS).toEqual(['competency', 'tool']);
    expect(isScoredKind('competency')).toBe(true);
    expect(isScoredKind('tool')).toBe(true);
    expect(isScoredKind('requirement')).toBe(false);
    expect(isScoredKind('trait')).toBe(false);
  });

  it('reconhece so os tipos validos', () => {
    expect(isItemKind('tool')).toBe(true);
    expect(isItemKind('hard')).toBe(false);
    expect(isItemKind(undefined)).toBe(false);
  });
});