import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: { rpc: mocks.rpc },
}));

import { createApplication } from './api';

const ROW = {
  id: 'app-1',
  job_id: 'job-1',
  candidate_id: 'cand-1',
  match_score: 80,
  created_at: '2026-10-27T12:00:00Z',
};

describe('createApplication', () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
  });

  it('candidata pela funcao apply_to_job, com as respostas', async () => {
    mocks.rpc.mockResolvedValue({
      data: { ...ROW, created: true, auto_rejected: false, unmet_requirements: [] },
      error: null,
    });

    const result = await createApplication('job-1', [{ requirementId: 'r1', meets: true }]);

    expect(mocks.rpc).toHaveBeenCalledWith('apply_to_job', {
      _job_id: 'job-1',
      _answers: [{ requirement_id: 'r1', meets: true }],
    });
    expect(result).toEqual({
      application: ROW,
      created: true,
      autoRejected: false,
      unmetRequirements: [],
    });
  });

  it('vaga sem requisito manda lista vazia', async () => {
    mocks.rpc.mockResolvedValue({ data: { ...ROW, created: false }, error: null });

    const result = await createApplication('job-1');

    expect(mocks.rpc).toHaveBeenCalledWith('apply_to_job', { _job_id: 'job-1', _answers: [] });
    expect(result.created).toBe(false);
  });

  it('traduz erro conhecido para portugues', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'job_not_active' } });

    await expect(createApplication('job-1')).rejects.toThrow(
      'Esta vaga não está mais recebendo candidaturas.',
    );
  });

  it('repassa erro desconhecido', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'falhou' } });

    await expect(createApplication('job-1')).rejects.toMatchObject({ message: 'falhou' });
  });
});