import { describe, expect, it } from 'vitest';
import { getScoreColor, getScoreHex } from './score';

describe('getScoreColor', () => {
  it('changes class at 80, 60 and 40', () => {
    expect(getScoreColor(100)).toBe('text-jm-purple');
    expect(getScoreColor(80)).toBe('text-jm-purple');
    expect(getScoreColor(79)).toBe('text-jm-teal');
    expect(getScoreColor(60)).toBe('text-jm-teal');
    expect(getScoreColor(59)).toBe('text-jm-orange');
    expect(getScoreColor(40)).toBe('text-jm-orange');
    expect(getScoreColor(39)).toBe('text-jm-red');
    expect(getScoreColor(0)).toBe('text-jm-red');
  });
});

describe('getScoreHex', () => {
  it('uses the same limits as the class', () => {
    expect(getScoreHex(80)).toBe('#7C5CFF');
    expect(getScoreHex(79)).toBe('#14B8A6');
    expect(getScoreHex(60)).toBe('#14B8A6');
    expect(getScoreHex(59)).toBe('#F97316');
    expect(getScoreHex(40)).toBe('#F97316');
    expect(getScoreHex(39)).toBe('#EF4444');
  });
});
