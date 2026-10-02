import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: { from: mocks.from },
}));

import {
  listRecruiterApplications,
  RECRUITER_APPLICATIONS_SELECT,
} from './recruiter-applications.api';

function mockQuery(result: unknown) {
  const order = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ order });
  mocks.from.mockReturnValue({ select });
  return { select, order };
}

describe('listRecruiterApplications', () => {
  beforeEach(() => {
    mocks.from.mockReset();
  });

  it('reads applications from the newest to the oldest', async () => {
    const rows = [{ id: 'a1' }, { id: 'a2' }];
    const { select, order } = mockQuery({ data: rows, error: null });

    await expect(listRecruiterApplications()).resolves.toEqual(rows);

    expect(mocks.from).toHaveBeenCalledWith('applications');
    expect(select).toHaveBeenCalledWith(RECRUITER_APPLICATIONS_SELECT);
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('asks for the candidate profile, the name and the job title', () => {
    expect(RECRUITER_APPLICATIONS_SELECT).toContain('candidate_profiles(');
    expect(RECRUITER_APPLICATIONS_SELECT).toContain('profiles(full_name)');
    expect(RECRUITER_APPLICATIONS_SELECT).toContain('jobs(title)');
    expect(RECRUITER_APPLICATIONS_SELECT).toContain('current_stage');
  });

  it('returns an empty list when there is no data', async () => {
    mockQuery({ data: null, error: null });
    await expect(listRecruiterApplications()).resolves.toEqual([]);
  });

  it('throws the database error', async () => {
    mockQuery({ data: null, error: { message: 'falhou' } });
    await expect(listRecruiterApplications()).rejects.toEqual({ message: 'falhou' });
  });
});
