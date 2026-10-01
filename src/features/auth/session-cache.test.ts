import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { authQueryKey, clearAuthSessionCache } from './session-cache';

describe('clearAuthSessionCache', () => {
  it('keeps the cache null even when a pending session refetch resolves with a user afterwards', async () => {
    const client = new QueryClient();

    let resolveRefetch: ((user: { id: string }) => void) | undefined;
    let refetchStarted = false;

    // Simulate a getSession() refetch that is still in-flight and would resolve
    // with an authenticated user (the stale read triggered by USER_UPDATED).
    const fetchPromise = client.fetchQuery({
      queryKey: authQueryKey,
      queryFn: () => {
        refetchStarted = true;
        return new Promise<{ id: string }>((resolve) => {
          resolveRefetch = resolve;
        });
      },
    });
    void fetchPromise.catch(() => undefined);

    await vi.waitFor(() => expect(refetchStarted).toBe(true));

    // Sign-out path: cancel the pending refetch, then write null.
    await clearAuthSessionCache(client);

    expect(client.getQueryData(authQueryKey)).toBeNull();

    // The stale refetch finally resolves with a user; it must not overwrite null.
    resolveRefetch?.({ id: 'user-1' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.getQueryData(authQueryKey)).toBeNull();
  });
});
