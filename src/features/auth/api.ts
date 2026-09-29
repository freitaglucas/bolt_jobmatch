import type { User } from '@supabase/supabase-js';
import { supabase } from '../../shared/lib/supabase';
import { SignInSchema, SignUpSchema, UserRoleSchema } from './schemas';
import type {
  AuthUser,
  SignInCredentials,
  SignUpCredentials,
  SignUpResult,
} from './types';

export function mapAuthUser(user: User, role: unknown): AuthUser {
  const parsedRole = UserRoleSchema.safeParse(role);

  return {
    id: user.id,
    email: user.email ?? null,
    fullName:
      typeof user.user_metadata['full_name'] === 'string'
        ? user.user_metadata['full_name']
        : null,
    role: parsedRole.success ? parsedRole.data : null,
    supabaseUser: user,
  };
}

async function getAuthUser(user: User): Promise<AuthUser> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapAuthUser(user, data?.role);
}

export async function signIn(credentials: SignInCredentials): Promise<AuthUser> {
  const validatedCredentials = SignInSchema.parse(credentials);
  const { data, error } = await supabase.auth.signInWithPassword(validatedCredentials);
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('O Supabase não retornou um usuário autenticado.');
  }
  return getAuthUser(data.user);
}

export async function signUp(
  credentials: SignUpCredentials,
): Promise<SignUpResult> {
  const validatedCredentials = SignUpSchema.parse(credentials);
  const { data, error } = await supabase.auth.signUp({
    email: validatedCredentials.email,
    password: validatedCredentials.password,
    options: {
      data: {
        full_name: validatedCredentials.fullName,
        role: validatedCredentials.role,
      },
    },
  });
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('O Supabase não retornou o usuário criado.');
  }

  return {
    user: data.session ? await getAuthUser(data.user) : mapAuthUser(data.user, null),
    requiresEmailConfirmation: data.session === null,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session ? getAuthUser(data.session.user) : null;
}