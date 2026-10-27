import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SKILL_LEVEL,
  MAX_SKILL_LEVEL,
  SKILL_LEVELS,
  SKILL_LEVEL_DESCRIPTORS,
  skillLevelDescriptor,
  skillLevelName,
  toSkillLevel,
} from './levels';

describe('regua de 3 niveis', () => {
  it('tem exatamente basico, intermediario e avancado', () => {
    expect(SKILL_LEVELS).toEqual([1, 2, 3]);
    expect(MAX_SKILL_LEVEL).toBe(3);
    expect(SKILL_LEVELS.map(skillLevelName)).toEqual(['Básico', 'Intermediário', 'Avançado']);
  });

  it('comeca em intermediario', () => {
    expect(DEFAULT_SKILL_LEVEL).toBe(2);
  });

  it('todo nivel tem descritor', () => {
    for (const level of SKILL_LEVELS) {
      expect(SKILL_LEVEL_DESCRIPTORS[level].length).toBeGreaterThan(20);
    }
    expect(skillLevelDescriptor(3)).toBe(SKILL_LEVEL_DESCRIPTORS[3]);
  });

  it('prende valores fora da regua entre 1 e 3', () => {
    expect(toSkillLevel(0)).toBe(1);
    expect(toSkillLevel(-2)).toBe(1);
    expect(toSkillLevel(Number.NaN)).toBe(1);
    expect(toSkillLevel(2.4)).toBe(2);
    expect(toSkillLevel(3.45)).toBe(3);
    expect(toSkillLevel(5)).toBe(3);
  });

  it('nao fala de nivel especialista nem de numero', () => {
    for (const level of SKILL_LEVELS) {
      expect(skillLevelName(level).toLowerCase()).not.toMatch(/especialista|\d/);
    }
  });
});
