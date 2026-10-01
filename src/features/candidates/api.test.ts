import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  },
}));

import {
  getMyCandidateProfile,
  isCandidateProfileComplete,
  saveMyCandidateProfile,
} from './api';
import type { CandidateProfile, CandidateSkillSelection } from './types';

type MockFn = ReturnType<typeof vi.fn>;

interface MockBuilder {
  select: MockFn;
  eq: MockFn;
  in: MockFn;
  limit: MockFn;
  order: MockFn;
  single: MockFn;
  maybeSingle: MockFn;
  update: MockFn;
  upsert: MockFn;
  delete: MockFn;
  insert: MockFn;
  then: (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
}

const chainMethods = [
  'select',
  'eq',
  'in',
  'limit',
  'order',
  'single',
  'maybeSingle',
  'update',
  'upsert',
  'delete',
  'insert',
] as const;

function buildChain(result: unknown): MockBuilder {
  const builder = {} as MockBuilder;
  for (const name of chainMethods) {
    builder[name] = vi.fn();
  }
  for (const name of chainMethods) {
    builder[name].mockReturnValue(builder);
  }
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
}

const uuid = (n: number) => `00000000-0000-0000-0000-00000000000${n}`;

function makeSkills(): CandidateSkillSelection[] {
  return [
    {
      skillId: uuid(1),
      name: 'Git',
      category: 'hard',
      declaredLevel: 3,
      evidencedByProject: true,
    },
    {
      skillId: uuid(2),
      name: 'Node.js',
      category: 'hard',
      declaredLevel: 4,
      evidencedByProject: false,
    },
    {
      skillId: uuid(3),
      name: 'Liderança',
      category: 'soft',
      declaredLevel: 2,
      evidencedByProject: false,
    },
  ];
}

function makeProfile(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    fullName: 'Ana Silva',
    currentPosition: 'Analista',
    location: 'São Paulo, SP',
    phone: '',
    bio: '',
    desiredPositions: ['Analista de Inovação'],
    yearsOfExperience: 3,
    seniorityGeneral: 'Pleno',
    acceptedContractTypes: ['CLT'],
    acceptedWorkModels: ['remoto'],
    willingToRelocate: false,
    salaryExpectation: null,
    skills: makeSkills(),
    ...overrides,
  };
}

describe('isCandidateProfileComplete', () => {
  it('is complete with name, location and at least 3 skills', () => {
    expect(isCandidateProfileComplete(makeProfile())).toBe(true);
  });

  it('is incomplete without a location', () => {
    expect(isCandidateProfileComplete(makeProfile({ location: '' }))).toBe(false);
  });

  it('is incomplete with fewer than 3 skills', () => {
    expect(
      isCandidateProfileComplete(makeProfile({ skills: makeSkills().slice(0, 2) })),
    ).toBe(false);
  });
});

describe('getMyCandidateProfile', () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.from.mockReset();
  });

  it('reads salary from candidate_private_preferences, not candidate_profiles', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mocks.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return buildChain({ data: { full_name: 'Ana Silva' }, error: null });
      }
      if (table === 'candidate_profiles') {
        return buildChain({
          data: {
            current_position: 'Analista',
            location: 'SP',
            salary_expectation: 999999,
          },
          error: null,
        });
      }
      if (table === 'candidate_private_preferences') {
        return buildChain({ data: { salary_expectation: 8000 }, error: null });
      }
      if (table === 'candidate_skills') {
        return buildChain({
          data: [
            { skill_id: uuid(1), declared_level: 3, evidenced_by_project: true },
            { skill_id: uuid(2), declared_level: 4, evidenced_by_project: false },
            { skill_id: uuid(3), declared_level: 2, evidenced_by_project: false },
          ],
          error: null,
        });
      }
      if (table === 'skills') {
        return buildChain({
          data: [
            { id: uuid(1), name: 'Git', category: 'hard' },
            { id: uuid(2), name: 'Node.js', category: 'hard' },
            { id: uuid(3), name: 'Liderança', category: 'soft' },
          ],
          error: null,
        });
      }
      return buildChain({ data: null, error: null });
    });

    const profile = await getMyCandidateProfile();

    expect(profile.salaryExpectation).toBe(8000);
    expect(mocks.from).toHaveBeenCalledWith('candidate_private_preferences');
  });

  it('maps the new candidate_profiles columns', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mocks.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return buildChain({ data: { full_name: 'Ana Silva' }, error: null });
      }
      if (table === 'candidate_profiles') {
        return buildChain({
          data: {
            current_position: 'Analista',
            location: 'SP',
            phone: '11999999999',
            bio: 'bio',
            desired_positions: ['Analista de Inovação'],
            years_of_experience: 3,
            seniority_general: 'Pleno',
            accepted_contract_types: ['CLT', 'PJ'],
            accepted_work_models: ['presencial', 'remoto'],
            willing_to_relocate: true,
          },
          error: null,
        });
      }
      if (table === 'candidate_private_preferences') {
        return buildChain({ data: { salary_expectation: 8000 }, error: null });
      }
      if (table === 'candidate_skills') {
        return buildChain({
          data: [
            { skill_id: uuid(1), declared_level: 3, evidenced_by_project: true },
            { skill_id: uuid(2), declared_level: 4, evidenced_by_project: false },
            { skill_id: uuid(3), declared_level: 2, evidenced_by_project: false },
          ],
          error: null,
        });
      }
      if (table === 'skills') {
        return buildChain({
          data: [
            { id: uuid(1), name: 'Git', category: 'hard' },
            { id: uuid(2), name: 'Node.js', category: 'hard' },
            { id: uuid(3), name: 'Liderança', category: 'soft' },
          ],
          error: null,
        });
      }
      return buildChain({ data: null, error: null });
    });

    const profile = await getMyCandidateProfile();

    expect(profile.acceptedContractTypes).toEqual(['CLT', 'PJ']);
    expect(profile.acceptedWorkModels).toEqual(['presencial', 'remoto']);
    expect(profile.willingToRelocate).toBe(true);
  });
});


describe('saveMyCandidateProfile', () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.from.mockReset();
  });

  it('maps new columns to candidate_profiles and salary to private prefs', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const candidateChain = buildChain({ error: null });
    const prefsChain = buildChain({ error: null });
    const skillsChain = buildChain({ data: [], error: null });

    mocks.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return buildChain({ error: null });
      }
      if (table === 'candidate_profiles') {
        return candidateChain;
      }
      if (table === 'candidate_private_preferences') {
        return prefsChain;
      }
      if (table === 'candidate_skills') {
        return skillsChain;
      }
      return buildChain({ error: null });
    });

    await saveMyCandidateProfile({
      fullName: 'Ana Silva',
      currentPosition: 'Analista',
      location: 'São Paulo, SP',
      phone: '',
      bio: '',
      desiredPositions: ['Analista de Inovação'],
      yearsOfExperience: 3,
      seniorityGeneral: 'Pleno',
      acceptedContractTypes: ['CLT', 'PJ'],
      acceptedWorkModels: ['presencial', 'remoto'],
      willingToRelocate: true,
      salaryExpectation: 12000,
      skills: makeSkills().map(
        ({ skillId, declaredLevel, evidencedByProject }) => ({
          skillId,
          declaredLevel,
          evidencedByProject,
        }),
      ),
    });

    expect(candidateChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        accepted_contract_types: ['CLT', 'PJ'],
        accepted_work_models: ['presencial', 'remoto'],
        willing_to_relocate: true,
      }),
      { onConflict: 'user_id' },
    );
    expect(candidateChain.upsert.mock.calls[0][0]).not.toHaveProperty(
      'salary_expectation',
    );

    expect(prefsChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ salary_expectation: 12000 }),
      { onConflict: 'user_id' },
    );
  });
});

