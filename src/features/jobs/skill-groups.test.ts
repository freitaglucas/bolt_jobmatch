import { describe, expect, it } from 'vitest';
import {
  groupMembers,
  groupRuleText,
  minOptions,
  nextGroupKey,
  validateGroups,
  type DraftGroup,
} from './skill-groups';

const group = (key: string, minCount = 1): DraftGroup => ({ key, minCount, role: 'required' });

describe('grupos de alternativas na vaga', () => {
  it('cria chaves que nao repetem', () => {
    expect(nextGroupKey([])).toBe('g1');
    expect(nextGroupKey([group('g1'), group('g3')])).toBe('g4');
    expect(nextGroupKey([group('g2')])).toBe('g3');
  });

  it('lista os membros de um grupo', () => {
    const items = [
      { skillId: 'a', groupKey: 'g1' },
      { skillId: 'b' },
      { skillId: 'c', groupKey: 'g1' },
    ];
    expect(groupMembers(items, 'g1').map((item) => item.skillId)).toEqual(['a', 'c']);
  });

  it('o minimo vai de 1 ate um a menos que o grupo', () => {
    expect(minOptions(2)).toEqual([1]);
    expect(minOptions(4)).toEqual([1, 2, 3]);
    expect(minOptions(1)).toEqual([1]);
  });

  it('aceita grupo com 2 ou mais itens e minimo menor que o grupo', () => {
    const items = [
      { skillId: 'a', groupKey: 'g1' },
      { skillId: 'b', groupKey: 'g1' },
      { skillId: 'c' },
    ];
    expect(validateGroups(items, [group('g1', 1)])).toBeNull();
    expect(validateGroups([{ skillId: 'c' }], [])).toBeNull();
  });

  it('recusa grupo pequeno, minimo alto e item em grupo apagado', () => {
    expect(validateGroups([{ skillId: 'a', groupKey: 'g1' }], [group('g1')])).toBe(
      'O grupo de alternativas 1 precisa de pelo menos 2 itens.',
    );
    expect(
      validateGroups(
        [
          { skillId: 'a', groupKey: 'g1' },
          { skillId: 'b', groupKey: 'g1' },
        ],
        [group('g1', 2)],
      ),
    ).toBe('No grupo de alternativas 1, o mínimo precisa ser menor que o número de itens.');
    expect(validateGroups([{ skillId: 'a', groupKey: 'g9' }], [])).toBe(
      'Um item está num grupo de alternativas que não existe mais.',
    );
  });

  it('descreve a regra do grupo', () => {
    expect(groupRuleText(1, 3)).toBe('Basta 1 de 3');
  });
});
