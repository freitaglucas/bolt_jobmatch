import { supabase } from '../../shared/lib/supabase';

export interface CreatedApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  match_score: number;
  created_at: string;
}

export interface CreateApplicationResult {
  application: CreatedApplication;
  created: boolean;
}

export async function createApplication(
  jobId: string,
): Promise<CreateApplicationResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }
  if (!authData.user) {
    throw new Error('Entre na sua conta para se candidatar.');
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      candidate_id: authData.user.id,
    })
    .select('id, job_id, candidate_id, match_score, created_at')
    .single();

  if (!error) {
    return { application: data, created: true };
  }

  if (error.code !== '23505') {
    throw error;
  }

  const { data: existingApplication, error: existingError } = await supabase
    .from('applications')
    .select('id, job_id, candidate_id, match_score, created_at')
    .eq('job_id', jobId)
    .eq('candidate_id', authData.user.id)
    .single();

  if (existingError) {
    throw existingError;
  }

  return { application: existingApplication, created: false };
}