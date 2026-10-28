import { describe, expect, it } from 'vitest';
import { SKILL_GROUP_LABELS, filterSkills, normalizeText, skillGroup } from './search';
import type { SkillOption } from './api';

const SKILLS: SkillOption[] = [
  { id: '1', name: 'Comunicação', category: 'soft' },
  { id: '2', name: 'Liderança', category: 'soft' },
  { id: '3', name: 'SQL', category: 'hard' },
  { id: '4', name: 'Python', category: 'hard' },
  { id: '5', name: 'Docker', category: 'hard', kind: 'tool' },
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
    expect(result.total).toBe(5);
  });

  it('hides skills that were already chosen', () => {
    const result = filterSkills(SKILLS, '', ['1', '3'], 10);
    expect(result.items.map((skill) => skill.id)).toEqual(['2', '4', '5']);
    expect(result.total).toBe(3);
  });

  it('filters by category when one is given', () => {
    const result = filterSkills(SKILLS, '', [], 10, 'hard');
    expect(result.items.map((skill) => skill.id)).toEqual(['3', '4']);
    expect(result.total).toBe(2);
  });

  it('keeps every category when category is null', () => {
    expect(filterSkills(SKILLS, '', [], 10, null).total).toBe(5);
  });

  it('filters tools apart from technical competencies', () => {
    expect(filterSkills(SKILLS, '', [], 10, 'tool').items.map((skill) => skill.id)).toEqual(['5']);
  });

  it('labels each group', () => {
    expect(SKILLS.map((skill) => SKILL_GROUP_LABELS[skillGroup(skill)])).toEqual([
      'Comportamental',
      'Comportamental',
      'Técnica',
      'Técnica',
      'Ferramenta',
    ]);
  });

  it('returns nothing when no skill matches', () => {
    const result = filterSkills(SKILLS, 'xyz', [], 10);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
