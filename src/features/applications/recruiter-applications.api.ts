import { supabase } from '../../shared/lib/supabase';
import type { RecruiterApplicationRow } from './recruiter-applications';

export const RECRUITER_APPLICATIONS_SELECT =
  'id, job_id, current_stage, match_score, created_at, silver_medalist, jobs(title), candidate_profiles(current_position, seniority_general, location, years_of_experience, profiles(full_name))';

// As regras de acesso (RLS) ja limitam o resultado as candidaturas das vagas do
// proprio recrutador aprovado, e liberam o perfil de quem se candidatou.
export async function listRecruiterApplications(): Promise<RecruiterApplicationRow[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(RECRUITER_APPLICATIONS_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as RecruiterApplicationRow[];
}
