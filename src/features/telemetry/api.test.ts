import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: () => ({ insert: mocks.insert }),
  },
}));

import {
  isRepeatedMilestone,
  trackApplicationSubmitted,
  trackJobViewed,
  trackProfileCompleted,
  trackProfileStarted,
} from './api';

const USER = '11111111-1111-4111-8111-111111111111';
const JOB = '22222222-2222-4222-8222-222222222222';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: USER } }, error: null });
  mocks.insert.mockReset().mockResolvedValue({ error: null });
});

function inserted(): Record<string, unknown> {
  return mocks.insert.mock.calls[0]?.[0] as Record<string, unknown>;
}

describe('funnel events (N84)', () => {
  it('records "comecou o perfil" with the job link origin and the user as target', async () => {
    await trackProfileStarted({ source: 'job_link', source_job_id: JOB });
    expect(inserted()).toMatchObject({
      user_id: USER,
      event_type: 'profile_started',
      target_type: 'candidate',
      target_id: USER,
      metadata: { source: 'job_link', source_job_id: JOB },
    });
  });

  it('ignores the repeated milestone (unique index) but not other errors', async () => {
    mocks.insert.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate' } });
    await expect(trackProfileCompleted({ source: 'direct' })).resolves.toBeUndefined();

    mocks.insert.mockResolvedValueOnce({ error: { code: '42501', message: 'rls' } });
    await expect(trackProfileCompleted({ source: 'direct' })).rejects.toMatchObject({ code: '42501' });
  });

  it('records "abriu a vaga" on the job', async () => {
    await trackJobViewed(JOB, 'job_link');
    expect(inserted()).toMatchObject({
      event_type: 'job_viewed',
      target_type: 'job',
      target_id: JOB,
      metadata: { job_id: JOB, source: 'job_link' },
    });
  });

  it('adds the origin to the application event', async () => {
    await trackApplicationSubmitted(JOB, 80, undefined, 'job_link');
    expect(inserted()).toMatchObject({
      event_type: 'application_submitted',
      metadata: { job_id: JOB, score: 80, source: 'job_link' },
    });
  });

  it('does nothing without a logged user', async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await trackJobViewed(JOB, 'detail');
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

describe('isRepeatedMilestone', () => {
  it('is true only for unique violations', () => {
    expect(isRepeatedMilestone({ code: '23505' })).toBe(true);
    expect(isRepeatedMilestone({ code: '23514' })).toBe(false);
    expect(isRepeatedMilestone(null)).toBe(false);
  });
});
