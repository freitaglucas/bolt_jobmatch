import { describe, expect, it } from 'vitest';
import {
  CandidateSkillsSchema,
  DeclaredLevelSchema,
  SaveCandidateProfileSchema,
} from './schemas';

const skill = (n: number) => ({
  skillId: `00000000-0000-0000-0000-00000000000${n}`,
  declaredLevel: 3,
  evidencedByProject: false,
});

function validInput() {
  return {
    fullName: 'Ana Silva',
    currentPosition: '',
    location: 'São Paulo, SP',
    phone: '',
    bio: '',
    desiredPositions: ['Analista de Inovação'],
    yearsOfExperience: 3,
    seniorityGeneral: 'Pleno',
    acceptedContractTypes: ['CLT'],
    acceptedWorkModels: ['remoto'],
    willingToRelocate: false,
    salaryExpectation: 8000,
    skills: [skill(1), skill(2), skill(3)],
  };
}

describe('DeclaredLevelSchema', () => {
  it('accepts levels between 1 and 5', () => {
    expect(() => DeclaredLevelSchema.parse(1)).not.toThrow();
    expect(() => DeclaredLevelSchema.parse(5)).not.toThrow();
  });

  it('rejects levels outside 1-5', () => {
    expect(() => DeclaredLevelSchema.parse(0)).toThrow();
    expect(() => DeclaredLevelSchema.parse(6)).toThrow();
  });
});

describe('CandidateSkillsSchema', () => {
  it('requires at least 3 skills', () => {
    expect(() =>
      CandidateSkillsSchema.parse([skill(1), skill(2)]),
    ).toThrow();
  });

  it('accepts 3 or more skills', () => {
    expect(() =>
      CandidateSkillsSchema.parse([skill(1), skill(2), skill(3)]),
    ).not.toThrow();
  });
});

describe('SaveCandidateProfileSchema', () => {
  it('accepts a valid profile', () => {
    expect(() => SaveCandidateProfileSchema.parse(validInput())).not.toThrow();
  });

  it('rejects a negative salary expectation', () => {
    expect(() =>
      SaveCandidateProfileSchema.parse({
        ...validInput(),
        salaryExpectation: -1,
      }),
    ).toThrow();
  });

  it('rejects an invalid work model', () => {
    expect(() =>
      SaveCandidateProfileSchema.parse({
        ...validInput(),
        acceptedWorkModels: ['narnia'],
      }),
    ).toThrow();
  });
});
