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

import { acceptTcleConsent, hasTcleConsent, recordConsent } from './api';

function selectChain(result: unknown) {
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          limit: () => Promise.resolve(result),
        }),
      }),
    }),
  };
}

function insertChain(result: unknown) {
  return {
    insert: () => Promise.resolve(result),
  };
}

describe('consents api', () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.from.mockReset();
  });

  describe('hasTcleConsent', () => {
    it('returns true when a tcle consent exists', async () => {
      mocks.from.mockReturnValue(selectChain({ data: [{ id: 'c1' }], error: null }));

      await expect(hasTcleConsent('user-1')).resolves.toBe(true);
    });

    it('returns false when no tcle consent exists', async () => {
      mocks.from.mockReturnValue(selectChain({ data: [], error: null }));

      await expect(hasTcleConsent('user-1')).resolves.toBe(false);
    });

    it('propagates a query error', async () => {
      mocks.from.mockReturnValue(selectChain({ data: null, error: { message: 'boom' } }));

      await expect(hasTcleConsent('user-1')).rejects.toMatchObject({ message: 'boom' });
    });
  });

  describe('recordConsent', () => {
    it('inserts a consent for the logged-in user', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
      mocks.from.mockReturnValue(insertChain({ error: null }));

      await expect(
        recordConsent({ consent_type: 'tcle', policy_version: 'v1' }),
      ).resolves.toBeUndefined();

      expect(mocks.from).toHaveBeenCalledWith('consents');
    });

    it('throws when there is no logged-in user', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(
        recordConsent({ consent_type: 'tcle', policy_version: 'v1' }),
      ).rejects.toThrow('Entre na sua conta para aceitar os termos.');
    });

    it('rejects invalid input before touching supabase', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

      await expect(
        recordConsent({ consent_type: 'tcle', policy_version: '   ' }),
      ).rejects.toThrow();

      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.getUser).not.toHaveBeenCalled();
    });
  });

  describe('acceptTcleConsent', () => {
    it('records a tcle consent with the current policy version', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
      mocks.from.mockReturnValue(insertChain({ error: null }));

      await acceptTcleConsent();

      expect(mocks.from).toHaveBeenCalledWith('consents');
    });
  });
});
