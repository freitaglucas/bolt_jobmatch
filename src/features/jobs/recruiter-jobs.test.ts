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
  deleteJob,
  isForeignKeyViolation,
  listRecruiterJobs,
  mapRecruiterJob,
  setJobStatus,
  type RecruiterJobRow,
} from './recruiter-jobs';

function row(overrides: Partial<RecruiterJobRow> = {}): RecruiterJobRow {
  return {
    id: 'job-1',
    title: 'Analista de Projetos Júnior',
    description: 'Descrição da vaga com mais de vinte caracteres.',
    location: 'São Paulo, SP',
    salary_range: 'R$ 7.200',
    employment_type: 'CLT',
    status: 'active',
    created_at: '2026-10-01T12:00:00Z',
    applications: [],
    ...overrides,
  };
}

describe('mapRecruiterJob', () => {
  it('maps an active job using the company name', () => {
    const job = mapRecruiterJob(row(), 'Job Match');
    expect(job).toMatchObject({
      id: 'job-1',
      title: 'Analista de Projetos Júnior',
      company: 'Job Match',
      location: 'São Paulo, SP',
      salary: 'R$ 7.200',
      type: 'CLT',
      status: 'Ativa',
      candidatesCount: 0,
      newCandidatesCount: 0,
      interviewCount: 0,
    });
    expect(job.skills).toEqual([]);
    expect(job.tags).toEqual([]);
  });

  it('translates every job status', () => {
    expect(mapRecruiterJob(row({ status: 'draft' }), '').status).toBe('Rascunho');
    expect(mapRecruiterJob(row({ status: 'active' }), '').status).toBe('Ativa');
    expect(mapRecruiterJob(row({ status: 'paused' }), '').status).toBe('Pausada');
    expect(mapRecruiterJob(row({ status: 'closed' }), '').status).toBe('Fechada');
  });

  it('uses "A combinar" when there is no salary range', () => {
    expect(mapRecruiterJob(row({ salary_range: null }), '').salary).toBe('A combinar');
  });

  it('falls back to CLT for an unknown employment type', () => {
    expect(mapRecruiterJob(row({ employment_type: 'Outro' }), '').type).toBe('CLT');
  });

  it('counts applications by stage and ignores withdrawn ones', () => {
    const job = mapRecruiterJob(
      row({
        applications: [
          { current_stage: 'new_application' },
          { current_stage: 'new_application' },
          { current_stage: 'screening' },
          { current_stage: 'interview' },
          { current_stage: 'final_interview' },
          { current_stage: 'withdrawn' },
        ],
      }),
      '',
    );
    expect(job.candidatesCount).toBe(5);
    expect(job.newCandidatesCount).toBe(2);
    expect(job.interviewCount).toBe(2);
  });

  it('handles a job without applications', () => {
    const job = mapRecruiterJob(row({ applications: null }), '');
    expect(job.candidatesCount).toBe(0);
  });
});

describe('isForeignKeyViolation', () => {
  it('recognises the Postgres foreign key error code', () => {
    expect(isForeignKeyViolation({ code: '23503', message: 'x' })).toBe(true);
  });

  it('rejects other errors', () => {
    expect(isForeignKeyViolation(new Error('x'))).toBe(false);
    expect(isForeignKeyViolation({ code: '42501' })).toBe(false);
    expect(isForeignKeyViolation(null)).toBe(false);
  });
});

describe('listRecruiterJobs', () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.from.mockReset();
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  it('reads only the logged recruiter jobs, newest first', async () => {
    const order = vi.fn().mockResolvedValue({ data: [row()], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    const result = await listRecruiterJobs();

    expect(mocks.from).toHaveBeenCalledWith('jobs');
    expect(eq).toHaveBeenCalledWith('recruiter_id', 'user-1');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toHaveLength(1);
  });

  it('throws when the query fails', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'falhou' } });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    await expect(listRecruiterJobs()).rejects.toMatchObject({ message: 'falhou' });
  });

  it('throws when nobody is logged in', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(listRecruiterJobs()).rejects.toThrow('Entre na sua conta para ver suas vagas.');
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe('setJobStatus', () => {
  beforeEach(() => {
    mocks.from.mockReset();
  });

  it('updates the status of the given job', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ update });

    await setJobStatus('job-1', 'paused');

    expect(mocks.from).toHaveBeenCalledWith('jobs');
    expect(update).toHaveBeenCalledWith({ status: 'paused' });
    expect(eq).toHaveBeenCalledWith('id', 'job-1');
  });

  it('throws when the update fails', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'falhou' } });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ update });

    await expect(setJobStatus('job-1', 'active')).rejects.toMatchObject({ message: 'falhou' });
  });
});

describe('deleteJob', () => {
  beforeEach(() => {
    mocks.from.mockReset();
  });

  it('deletes the given job', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ delete: remove });

    await deleteJob('job-1');

    expect(mocks.from).toHaveBeenCalledWith('jobs');
    expect(eq).toHaveBeenCalledWith('id', 'job-1');
  });

  it('throws when the delete fails', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { code: '23503', message: 'fk' } });
    const remove = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ delete: remove });

    await expect(deleteJob('job-1')).rejects.toMatchObject({ code: '23503' });
  });
});
