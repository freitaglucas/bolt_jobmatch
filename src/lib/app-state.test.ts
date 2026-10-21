import { describe, expect, it } from 'vitest';
import { resolveAppState } from './app-state';

const loading = { isLoading: true, hasUser: false, hasRole: false };
const anonymous = { isLoading: false, hasUser: false, hasRole: false };
const withRole = { isLoading: false, hasUser: true, hasRole: true };
const withoutRole = { isLoading: false, hasUser: true, hasRole: false };

describe('resolveAppState', () => {
  it('stays on the splash while the session loads', () => {
    expect(resolveAppState('loading', loading)).toBe('loading');
  });

  it('goes to the app for a logged user, never through the Landing', () => {
    expect(resolveAppState('loading', withRole)).toBe('app');
    expect(resolveAppState('loading', withoutRole)).toBe('auth');
  });

  it('shows the Landing only when there is no session', () => {
    expect(resolveAppState('loading', anonymous)).toBe('landing');
  });

  it('keeps where the visitor is (Landing or Auth) without a session', () => {
    expect(resolveAppState('auth', anonymous)).toBe('auth');
    expect(resolveAppState('landing', anonymous)).toBe('landing');
  });
});
