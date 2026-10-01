import type { QueryClient } from '@tanstack/react-query';

export const authQueryKey = ['auth', 'session'] as const;

/**
 * Cancels any in-flight session query and then clears the cached session.
 *
 * `cancelQueries` must settle before `setQueryData(null)` so that a pending
 * `getSession()` refetch (e.g. triggered by a `USER_UPDATED` event during a
 * password reset) cannot resolve after sign-out and write a stale user back
 * into the cache.
 */
export async function clearAuthSessionCache(client: QueryClient): Promise<void> {
  await client.cancelQueries({ queryKey: authQueryKey });
  client.setQueryData(authQueryKey, null);
}
