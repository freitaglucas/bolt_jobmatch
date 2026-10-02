import { describe, expect, it } from 'vitest';
import matchParitySql from '../../../../supabase/tests/match_parity.test.sql?raw';
import type { JobSkill } from '../../jobs/types';
import type { CandidateSkill } from '../types';
import { calculateMatch } from './calculateMatch';
import { PARITY_CASES, type ParityCase } from './parityCases';

function toJobSkills(parityCase: ParityCase): JobSkill[] {
  return parityCase.jobSkills.map((skill, index) => ({
    id: `${parityCase.id}-${index}`,
    job_id: parityCase.id,
    skill_name: skill.skill,
    required_level: skill.level,
    weight: skill.weight,
    mandatory: skill.mandatory,
  }));
}

function toCandidateSkills(parityCase: ParityCase): CandidateSkill[] {
  return parityCase.candidateSkills.map((skill) => ({
    skill_name: skill.skill,
    declared_level: skill.level,
    evidenced_by_project: skill.evidenced,
  }));
}

describe('Match Score parity cases (TypeScript side)', () => {
  it.each(PARITY_CASES)('$id gives $expectedScore', (parityCase) => {
    const result = calculateMatch(
      toJobSkills(parityCase),
      toCandidateSkills(parityCase),
    );
    expect(result.score).toBe(parityCase.expectedScore);
  });

  it('has unique case ids', () => {
    const ids = PARITY_CASES.map((parityCase) => parityCase.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Match Score parity cases are mirrored in the pgTAP test', () => {
  it('plans exactly one assertion per case', () => {
    expect(matchParitySql).toContain(`select plan(${PARITY_CASES.length});`);
  });

  it('has no extra or missing case markers', () => {
    const markers = matchParitySql.match(/^-- parity-case: /gm) ?? [];
    expect(markers).toHaveLength(PARITY_CASES.length);
  });

  it.each(PARITY_CASES)('$id has the same marker, inputs and score in SQL', (parityCase) => {
    expect(matchParitySql).toContain(
      `-- parity-case: ${parityCase.id} expected=${parityCase.expectedScore}`,
    );
    expect(matchParitySql).toContain(
      `'${JSON.stringify(parityCase.jobSkills)}'::jsonb`,
    );
    expect(matchParitySql).toContain(
      `'${JSON.stringify(parityCase.candidateSkills)}'::jsonb`,
    );
    expect(matchParitySql).toContain(`${parityCase.expectedScore}::numeric`);
  });
});
