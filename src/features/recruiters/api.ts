import { supabase } from '../../shared/lib/supabase';
import { RecruiterOnboardingSchema } from './schemas';
import type {
  RecruiterGateState,
  RecruiterOnboardingProfile,
  SaveRecruiterOnboardingInput,
} from './types';

async function getAuthenticatedUserId(): Promise<string> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }
  if (!authData.user) {
    throw new Error('Entre na sua conta para continuar.');
  }
  return authData.user.id;
}

export function getRecruiterGateState(
  profile: RecruiterOnboardingProfile,
): RecruiterGateState {
  if (profile.approvedAt !== null) {
    return profile.companyId === null ? 'company' : 'approved';
  }
  if (profile.companyId === null || profile.position.trim().length === 0) {
    return 'form';
  }
  return 'pending';
}

export async function getRecruiterOnboarding(): Promise<RecruiterOnboardingProfile> {
  const userId = await getAuthenticatedUserId();

  const { data: profileRow, error: profileError } = await supabase
    .from('recruiter_profiles')
    .select('company_id, position, phone, approved_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  let companyName: string | null = null;
  if (profileRow?.company_id) {
    const { data: companyRow, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', profileRow.company_id)
      .maybeSingle();

    if (companyError) {
      throw companyError;
    }
    companyName = companyRow?.name ?? null;
  }

  return {
    companyId: profileRow?.company_id ?? null,
    companyName,
    position: profileRow?.position ?? '',
    phone: profileRow?.phone ?? '',
    approvedAt: profileRow?.approved_at ?? null,
  };
}

export async function saveRecruiterOnboarding(
  input: SaveRecruiterOnboardingInput,
): Promise<void> {
  const validated = RecruiterOnboardingSchema.parse(input);
  const userId = await getAuthenticatedUserId();

  const { data: profileRow, error: profileError } = await supabase
    .from('recruiter_profiles')
    .select('company_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  let companyId = profileRow?.company_id ?? null;

  if (!companyId) {
    const { data: companyRows, error: insertError } = await supabase
      .from('companies')
      .insert({ created_by: userId, name: validated.companyName })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }
    companyId = companyRows.id;
  } else {
    const { error: updateCompanyError } = await supabase
      .from('companies')
      .update({ name: validated.companyName })
      .eq('id', companyId);

    if (updateCompanyError) {
      throw updateCompanyError;
    }
  }

  const { error: profileUpdateError } = await supabase
    .from('recruiter_profiles')
    .update({
      company_id: companyId,
      position: validated.position,
      phone: validated.phone || null,
    })
    .eq('user_id', userId);

  if (profileUpdateError) {
    throw profileUpdateError;
  }
}
