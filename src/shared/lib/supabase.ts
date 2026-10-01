import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { getRecoveryRedirectPath } from '../../features/auth/recovery-url';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration missing');
}

if (typeof window !== 'undefined') {
  const redirectPath = getRecoveryRedirectPath(
    window.location.pathname,
    window.location.search,
    window.location.hash,
  );
  if (redirectPath) {
    window.history.replaceState(null, '', redirectPath);
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
