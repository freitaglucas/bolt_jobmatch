import type { User } from '@supabase/supabase-js';
import type { Role } from '../../lib/types';

export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: Role | null;
  supabaseUser: User;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  fullName: string;
  role: Role;
  consentAccepted: boolean;
  confirmPassword: string;
}

export interface SignUpResult {
  user: AuthUser;
  requiresEmailConfirmation: boolean;
}