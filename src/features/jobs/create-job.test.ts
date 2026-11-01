import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  getRecruiterOnboarding: vi.fn(),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  },
}));

vi.mock('../recruiters/api', () => ({
  getRecruiterOnboarding: mocks.getRecruiterOnboarding,
}));

import {
  buildJobRequirementRows,
  buildJobSkillGroupRows,
  buildJobSkillRows,
  createJob,
} from './create-job';
import { CreateJobSchema, type CreateJobInput } from './create-job.schema';

type MockFn = ReturnType<typeof vi.fn>;

interface MockBuilder {
  select: MockFn;
  eq: MockFn;
  single: MockFn;
  insert: MockFn;
  update: MockFn;
  delete: MockFn;
  then: (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
}

const chainMethods = ['select', 'eq', 'single', 'insert', 'update', 'delete'] as const;

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

const SKILL_A = '11111111-1111-4111-8111-111111111111';
const SKILL_B = '22222222-2222-4222-8222-222222222222';
const REQ_A = '33333333-3333-4333-8333-333333333333';
const REQ_B = '44444444-4444-4444-8444-444444444444';

function validInput(overrides: Partial<CreateJobInput> = {}): CreateJobInput {
  return {
    title: 'Desenvolvedor(a) Backend Pleno',
    location: 'São Paulo, SP',
    description: 'Vaga para atuar com APIs e banco de dados em um time ágil.',
    salaryRange: 'R$ 6.000 – R$ 8.500',
    employmentType: 'CLT',
    skills: [
      { skillId: SKILL_A, requiredLevel: 3, mandatory: true },
      { skillId: SKILL_B, requiredLevel: 2, mandatory: false },
    ],
    ...overrides,
  };
}

describe('CreateJobSchema', () => {
  it('accepts a valid job', () => {
    expect(CreateJobSchema.safeParse(validInput()).success).toBe(true);
  });

  it('rejects a short title', () => {
    expect(CreateJobSchema.safeParse(validInput({ title: 'AB' })).success).toBe(false);
  });

  it('rejects a short description', () => {
    expect(CreateJobSchema.safeParse(validInput({ description: 'curta' })).success).toBe(false);
  });

  it('rejects a job without skills', () => {
    expect(CreateJobSchema.safeParse(validInput({ skills: [] })).success).toBe(false);
  });

  it('rejects a repeated skill', () => {
    const skills = [
      { skillId: SKILL_A, requiredLevel: 3, mandatory: true },
      { skillId: SKILL_A, requiredLevel: 2, mandatory: false },
    ];
    expect(CreateJobSchema.safeParse(validInput({ skills })).success).toBe(false);
  });

  it('rejects a level above 3 (avancado)', () => {
    const skills = [{ skillId: SKILL_A, requiredLevel: 4, mandatory: true }];
    expect(CreateJobSchema.safeParse(validInput({ skills })).success).toBe(false);
  });

  it('turns an empty salary into undefined', () => {
    const parsed = CreateJobSchema.parse(validInput({ salaryRange: '   ' }));
    expect(parsed.salaryRange).toBeUndefined();
  });

  it('starts with no requirements and trims the detail', () => {
    expect(CreateJobSchema.parse(validInput()).requirements).toEqual([]);
    const parsed = CreateJobSchema.parse(
      validInput({ requirements: [{ skillId: REQ_A, detail: '  ', eliminatory: true }] }),
    );
    expect(parsed.requirements).toEqual([{ skillId: REQ_A, detail: undefined, eliminatory: true }]);
  });

  it('rejects a repeated requirement and more than 8', () => {
    const repeated = [
      { skillId: REQ_A, eliminatory: true },
      { skillId: REQ_A, eliminatory: false },
    ];
    expect(CreateJobSchema.safeParse(validInput({ requirements: repeated })).success).toBe(false);
    const many = Array.from({ length: 9 }, (_, index) => ({
      skillId: `5555555${index}-5555-4555-8555-555555555555`,
      eliminatory: false,
    }));
    expect(CreateJobSchema.safeParse(validInput({ requirements: many })).success).toBe(false);
  });

  it('accepts a group of alternatives and rejects a group with one item', () => {
    const skills = [
      { skillId: SKILL_A, requiredLevel: 2, groupKey: 'g1' },
      { skillId: SKILL_B, requiredLevel: 2, groupKey: 'g1' },
    ];
    const groups = [{ key: 'g1', minCount: 1, role: 'required' as const }];
    expect(CreateJobSchema.safeParse(validInput({ skills, groups })).success).toBe(true);

    const lonely = CreateJobSchema.safeParse(
      validInput({
        skills: [{ skillId: SKILL_A, requiredLevel: 2, groupKey: 'g1' }],
        groups,
      }),
    );
    expect(lonely.success).toBe(false);
    expect(lonely.error?.issues[0]?.message).toBe(
      'O grupo de alternativas 1 precisa de pelo menos 2 itens.',
    );
  });

  it('accepts the role of each item', () => {
    const skills = [{ skillId: SKILL_A, requiredLevel: 2, role: 'implicit' as const }];
    expect(CreateJobSchema.safeParse(validInput({ skills })).success).toBe(true);
    const wrong = [{ skillId: SKILL_A, requiredLevel: 2, role: 'essencial' }];
    expect(
      CreateJobSchema.safeParse(validInput({ skills: wrong as unknown as CreateJobInput['skills'] }))
        .success,
    ).toBe(false);
  });
});

describe('buildJobSkillRows', () => {
  it('maps skills to job_skills rows with the default weight', () => {
    expect(
      buildJobSkillRows('job-1', [
        { skillId: SKILL_A, requiredLevel: 3, mandatory: true },
        { skillId: SKILL_B, requiredLevel: 2, mandatory: false },
      ]),
    ).toEqual([
      { job_id: 'job-1', skill_id: SKILL_A, required_level: 3, weight: 1, mandatory: true, role: 'required' },
      { job_id: 'job-1', skill_id: SKILL_B, required_level: 2, weight: 1, mandatory: false, role: 'preferred' },
    ]);
  });

  it('uses the role when given: only required marks mandatory', () => {
    expect(
      buildJobSkillRows('job-1', [
        { skillId: SKILL_A, requiredLevel: 2, role: 'implicit' },
        { skillId: SKILL_B, requiredLevel: 2, role: 'required' },
      ]).map(({ role, mandatory }) => ({ role, mandatory })),
    ).toEqual([
      { role: 'implicit', mandatory: false },
      { role: 'required', mandatory: true },
    ]);
  });
});

describe('buildJobSkillGroupRows', () => {
  it('creates the group rows with their own id', () => {
    expect(
      buildJobSkillGroupRows('job-1', [{ key: 'g1', minCount: 2, role: 'implicit' }], () => 'grp-1'),
    ).toEqual([{ id: 'grp-1', job_id: 'job-1', min_count: 2, role: 'implicit' }]);
  });

  it('items in a group point to it and take its role', () => {
    const row = { id: 'grp-1', job_id: 'job-1', min_count: 1, role: 'required' as const };
    const rows = buildJobSkillRows(
      'job-1',
      [
        { skillId: SKILL_A, requiredLevel: 2, role: 'preferred', groupKey: 'g1' },
        { skillId: SKILL_B, requiredLevel: 2, role: 'preferred' },
      ],
      [{ key: 'g1', row }],
    );
    expect(rows.map(({ role, mandatory, group_id }) => ({ role, mandatory, group_id }))).toEqual([
      { role: 'required', mandatory: true, group_id: 'grp-1' },
      { role: 'preferred', mandatory: false, group_id: undefined },
    ]);
  });
});

describe('buildJobRequirementRows', () => {
  it('maps requirements to job_requirements rows', () => {
    expect(
      buildJobRequirementRows('job-1', [
        { skillId: REQ_A, detail: 'moto não serve', eliminatory: true },
        { skillId: REQ_B, detail: undefined, eliminatory: false },
      ]),
    ).toEqual([
      { job_id: 'job-1', skill_id: REQ_A, detail: 'moto não serve', eliminatory: true },
      { job_id: 'job-1', skill_id: REQ_B, detail: null, eliminatory: false },
    ]);
  });
});

describe('createJob', () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.from.mockReset();
    mocks.getRecruiterOnboarding.mockReset();

    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mocks.getRecruiterOnboarding.mockResolvedValue({
      companyId: 'company-1',
      companyName: 'Acme',
      position: 'Tech Recruiter',
      phone: '',
      approvedAt: '2026-01-01T00:00:00Z',
    });
  });

  it('creates a draft, saves skills and then activates the job', async () => {
    const insertJobChain = buildChain({ data: { id: 'job-1' }, error: null });
    const activateChain = buildChain({ error: null });
    const skillsChain = buildChain({ error: null });
    const jobsChains = [insertJobChain, activateChain];
    const calls: string[] = [];
    let jobsCall = 0;

    mocks.from.mockImplementation((table: string) => {
      calls.push(table);
      if (table === 'jobs') {
        const chain = jobsChains[jobsCall] ?? buildChain({ error: null });
        jobsCall += 1;
        return chain;
      }
      if (table === 'job_skills') {
        return skillsChain;
      }
      return buildChain({ error: null });
    });

    const result = await createJob(validInput());

    expect(result).toEqual({ id: 'job-1' });
    expect(calls).toEqual(['jobs', 'job_skills', 'jobs']);
    expect(insertJobChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        recruiter_id: 'user-1',
        company_id: 'company-1',
        status: 'draft',
        employment_type: 'CLT',
        salary_range: 'R$ 6.000 – R$ 8.500',
      }),
    );
    expect(skillsChain.insert).toHaveBeenCalledWith([
      { job_id: 'job-1', skill_id: SKILL_A, required_level: 3, weight: 1, mandatory: true, role: 'required' },
      { job_id: 'job-1', skill_id: SKILL_B, required_level: 2, weight: 1, mandatory: false, role: 'preferred' },
    ]);
    expect(activateChain.update).toHaveBeenCalledWith({ status: 'active' });
    expect(activateChain.eq).toHaveBeenCalledWith('id', 'job-1');
  });

  it('saves the groups before the skills', async () => {
    const insertJobChain = buildChain({ data: { id: 'job-1' }, error: null });
    const activateChain = buildChain({ error: null });
    const groupsChain = buildChain({ error: null });
    const skillsChain = buildChain({ error: null });
    const jobsChains = [insertJobChain, activateChain];
    const calls: string[] = [];
    let jobsCall = 0;

    mocks.from.mockImplementation((table: string) => {
      calls.push(table);
      if (table === 'jobs') {
        const chain = jobsChains[jobsCall] ?? buildChain({ error: null });
        jobsCall += 1;
        return chain;
      }
      if (table === 'job_skill_groups') {
        return groupsChain;
      }
      if (table === 'job_skills') {
        return skillsChain;
      }
      return buildChain({ error: null });
    });

    await createJob(
      validInput({
        skills: [
          { skillId: SKILL_A, requiredLevel: 2, groupKey: 'g1' },
          { skillId: SKILL_B, requiredLevel: 2, groupKey: 'g1' },
        ],
        groups: [{ key: 'g1', minCount: 1, role: 'required' }],
      }),
    );

    expect(calls).toEqual(['jobs', 'job_skill_groups', 'job_skills', 'jobs']);
    const [groupRow] = groupsChain.insert.mock.calls[0]?.[0] as { id: string }[];
    const skillRows = skillsChain.insert.mock.calls[0]?.[0] as { group_id?: string }[];
    expect(skillRows.map((row) => row.group_id)).toEqual([groupRow?.id, groupRow?.id]);
  });

  it('saves the requirements after the skills', async () => {
    const insertJobChain = buildChain({ data: { id: 'job-1' }, error: null });
    const activateChain = buildChain({ error: null });
    const requirementsChain = buildChain({ error: null });
    const jobsChains = [insertJobChain, activateChain];
    const calls: string[] = [];
    let jobsCall = 0;

    mocks.from.mockImplementation((table: string) => {
      calls.push(table);
      if (table === 'jobs') {
        const chain = jobsChains[jobsCall] ?? buildChain({ error: null });
        jobsCall += 1;
        return chain;
      }
      if (table === 'job_requirements') {
        return requirementsChain;
      }
      return buildChain({ error: null });
    });

    await createJob(validInput({ requirements: [{ skillId: REQ_A, eliminatory: true }] }));

    expect(calls).toEqual(['jobs', 'job_skills', 'job_requirements', 'jobs']);
    expect(requirementsChain.insert).toHaveBeenCalledWith([
      { job_id: 'job-1', skill_id: REQ_A, detail: null, eliminatory: true },
    ]);
  });

  it('deletes the draft and throws when saving requirements fails', async () => {
    const insertJobChain = buildChain({ data: { id: 'job-1' }, error: null });
    const deleteChain = buildChain({ error: null });
    const jobsChains = [insertJobChain, deleteChain];
    let jobsCall = 0;

    mocks.from.mockImplementation((table: string) => {
      if (table === 'jobs') {
        const chain = jobsChains[jobsCall] ?? buildChain({ error: null });
        jobsCall += 1;
        return chain;
      }
      if (table === 'job_requirements') {
        return buildChain({ error: { message: 'falhou' } });
      }
      return buildChain({ error: null });
    });

    await expect(
      createJob(validInput({ requirements: [{ skillId: REQ_A, eliminatory: false }] })),
    ).rejects.toThrow('Não foi possível salvar os requisitos da vaga. Tente novamente.');
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.update).not.toHaveBeenCalled();
  });

  it('deletes the draft and throws when saving skills fails', async () => {
    const insertJobChain = buildChain({ data: { id: 'job-1' }, error: null });
    const deleteChain = buildChain({ error: null });
    const skillsChain = buildChain({ error: { message: 'falhou' } });
    const jobsChains = [insertJobChain, deleteChain];
    let jobsCall = 0;

    mocks.from.mockImplementation((table: string) => {
      if (table === 'jobs') {
        const chain = jobsChains[jobsCall] ?? buildChain({ error: null });
        jobsCall += 1;
        return chain;
      }
      if (table === 'job_skills') {
        return skillsChain;
      }
      return buildChain({ error: null });
    });

    await expect(createJob(validInput())).rejects.toThrow(
      'Não foi possível salvar as competências da vaga. Tente novamente.',
    );
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith('id', 'job-1');
    expect(deleteChain.update).not.toHaveBeenCalled();
  });

  it('throws when the recruiter has no company', async () => {
    mocks.getRecruiterOnboarding.mockResolvedValue({
      companyId: null,
      companyName: null,
      position: '',
      phone: '',
      approvedAt: '2026-01-01T00:00:00Z',
    });

    await expect(createJob(validInput())).rejects.toThrow(
      'Complete o cadastro da sua empresa antes de publicar vagas.',
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('rejects invalid input before touching the database', async () => {
    await expect(createJob(validInput({ title: 'AB' }))).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});
