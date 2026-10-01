import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      updateUser: mocks.updateUser,
    },
  },
}));

import { requestPasswordReset, updatePassword } from './api';

describe('requestPasswordReset', () => {
  beforeEach(() => {
    mocks.resetPasswordForEmail.mockReset();
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls resetPasswordForEmail with the correct redirectTo', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    await requestPasswordReset('candidate@test.local');

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('candidate@test.local', {
      redirectTo: 'http://localhost:3000/reset-password',
    });
  });

  it('stays neutral when the account does not exist', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { message: 'User not found' },
    });

    await expect(requestPasswordReset('candidate@test.local')).resolves.toBeUndefined();
  });
});

describe('updatePassword', () => {
  beforeEach(() => {
    mocks.updateUser.mockReset();
  });

  it('updates the password of the current user', async () => {
    mocks.updateUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

    await updatePassword('novaSenha123');

    expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'novaSenha123' });
  });

  it('throws when the update fails', async () => {
    mocks.updateUser.mockResolvedValue({
      data: null,
      error: { message: 'Update failed' },
    });

    await expect(updatePassword('novaSenha123')).rejects.toThrow();
  });
});
