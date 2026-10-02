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

import { buildJobSkillRows, createJob } from './create-job';
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

  it('rejects a level above 5', () => {
    const skills = [{ skillId: SKILL_A, requiredLevel: 6, mandatory: true }];
    expect(CreateJobSchema.safeParse(validInput({ skills })).success).toBe(false);
  });

  it('turns an empty salary into undefined', () => {
    const parsed = CreateJobSchema.parse(validInput({ salaryRange: '   ' }));
    expect(parsed.salaryRange).toBeUndefined();
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
      { job_id: 'job-1', skill_id: SKILL_A, required_level: 3, weight: 1, mandatory: true },
      { job_id: 'job-1', skill_id: SKILL_B, required_level: 2, weight: 1, mandatory: false },
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
      { job_id: 'job-1', skill_id: SKILL_A, required_level: 3, weight: 1, mandatory: true },
      { job_id: 'job-1', skill_id: SKILL_B, required_level: 2, weight: 1, mandatory: false },
    ]);
    expect(activateChain.update).toHaveBeenCalledWith({ status: 'active' });
    expect(activateChain.eq).toHaveBeenCalledWith('id', 'job-1');
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
