import { describe, expect, it } from 'vitest';
import { filterSkills, normalizeText } from './search';
import type { SkillOption } from './api';

const SKILLS: SkillOption[] = [
  { id: '1', name: 'Comunicação', category: 'soft' },
  { id: '2', name: 'Liderança', category: 'soft' },
  { id: '3', name: 'SQL', category: 'hard' },
  { id: '4', name: 'Python', category: 'hard' },
];

describe('normalizeText', () => {
  it('removes accents, lowercases and trims', () => {
    expect(normalizeText('  Comunicação ')).toBe('comunicacao');
  });
});

describe('filterSkills', () => {
  it('finds skills ignoring accents and case', () => {
    const result = filterSkills(SKILLS, 'COMUNICACAO', [], 10);
    expect(result.items.map((skill) => skill.id)).toEqual(['1']);
    expect(result.total).toBe(1);
  });

  it('returns everything for an empty query, up to the limit', () => {
    const result = filterSkills(SKILLS, '', [], 2);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(4);
  });

  it('hides skills that were already chosen', () => {
    const result = filterSkills(SKILLS, '', ['1', '3'], 10);
    expect(result.items.map((skill) => skill.id)).toEqual(['2', '4']);
    expect(result.total).toBe(2);
  });

  it('returns nothing when no skill matches', () => {
    const result = filterSkills(SKILLS, 'xyz', [], 10);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
