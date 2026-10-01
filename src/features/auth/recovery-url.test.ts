import { describe, expect, it } from 'vitest';
import { getAuthLinkError, getRecoveryRedirectPath } from './recovery-url';

describe('getRecoveryRedirectPath', () => {
  it('redirects to /reset-password when the hash has type=recovery', () => {
    expect(getRecoveryRedirectPath('/', '', '#access_token=x&type=recovery')).toBe(
      '/reset-password#access_token=x&type=recovery',
    );
  });

  it('redirects to /reset-password when the query has type=recovery', () => {
    expect(getRecoveryRedirectPath('/', '?type=recovery&code=abc', '')).toBe(
      '/reset-password?type=recovery&code=abc',
    );
  });

  it('does not redirect when already on /reset-password', () => {
    expect(
      getRecoveryRedirectPath('/reset-password', '', '#access_token=x&type=recovery'),
    ).toBeNull();
  });

  it('does not redirect for other auth flows such as signup', () => {
    expect(getRecoveryRedirectPath('/', '', '#access_token=x&type=signup')).toBeNull();
  });

  it('returns null when there is no hash or query', () => {
    expect(getRecoveryRedirectPath('/', '', '')).toBeNull();
  });
});

describe('getAuthLinkError', () => {
  it('returns a message when the hash contains an auth error', () => {
    expect(
      getAuthLinkError('', '#error=access_denied&error_code=otp_expired&error_description=x'),
    ).toBe('Este link é inválido ou expirou. Peça um novo na tela de login.');
  });

  it('returns null when there is no error', () => {
    expect(getAuthLinkError('', '')).toBeNull();
  });
});
