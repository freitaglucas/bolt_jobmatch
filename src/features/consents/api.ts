import { supabase } from '../../shared/lib/supabase';
import { TCLE_POLICY_VERSION } from './content';
import { ConsentInsertSchema } from './schemas';
import type { ConsentInsert } from './schemas';

export async function hasTcleConsent(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('consents')
    .select('id')
    .eq('user_id', userId)
    .eq('consent_type', 'tcle')
    .limit(1);

  if (error) {
    throw error;
  }

  return (data ?? []).length > 0;
}

export async function recordConsent(input: ConsentInsert): Promise<void> {
  const validated = ConsentInsertSchema.parse(input);

  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }
  if (!data.user) {
    throw new Error('Entre na sua conta para aceitar os termos.');
  }

  const { error } = await supabase.from('consents').insert({
    user_id: data.user.id,
    consent_type: validated.consent_type,
    policy_version: validated.policy_version,
  });

  if (error) {
    throw error;
  }
}

export async function acceptTcleConsent(): Promise<void> {
  await recordConsent({ consent_type: 'tcle', policy_version: TCLE_POLICY_VERSION });
}
