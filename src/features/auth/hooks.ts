import { createElement, useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '../../shared/lib/supabase';
import {
  getSession,
  mapAuthUser,
  signIn,
  signOut,
  signUp,
} from './api';
import type { SignInCredentials, SignUpCredentials } from './types';

const authQueryKey = ['auth', 'session'] as const;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthSessionListener() {
  const client = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      client.setQueryData(
        authQueryKey,
        session ? mapAuthUser(session.user) : null,
      );
    });

    return () => subscription.unsubscribe();
  }, [client]);

  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  return createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(AuthSessionListener),
    children,
  );
}

export function useAuth() {
  const client = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: authQueryKey,
    queryFn: getSession,
  });
  const signInMutation = useMutation({
    mutationFn: (credentials: SignInCredentials) => signIn(credentials),
    onSuccess: (user) => {
      client.setQueryData(authQueryKey, user);
    },
  });
  const signUpMutation = useMutation({
    mutationFn: (credentials: SignUpCredentials) => signUp(credentials),
    onSuccess: (result) => {
      if (!result.requiresEmailConfirmation) {
        client.setQueryData(authQueryKey, result.user);
      }
    },
  });
  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      client.setQueryData(authQueryKey, null);
    },
  });

  return {
    user: sessionQuery.data ?? null,
    isLoading: sessionQuery.isLoading,
    error: sessionQuery.error,
    signIn: signInMutation.mutateAsync,
    signUp: signUpMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
  };
}