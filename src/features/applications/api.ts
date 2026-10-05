import { supabase } from '../../shared/lib/supabase';
import {
  mapCandidateApplication,
  type CandidateApplication,
  type CandidateApplicationRow,
} from './candidate-applications';

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

export const CANDIDATE_APPLICATIONS_SELECT =
  'id, job_id, current_stage, match_score, created_at, jobs(title, companies(name)), feedbacks(content, sent_to_candidate_at, created_at), application_stages(new_stage, created_at)';

// "Minhas candidaturas". A policy de leitura de feedbacks nao exige
// sent_to_candidate_at, entao filtramos para nao expor feedback ainda nao
// enviado ao candidato.
export async function listCandidateApplications(): Promise<CandidateApplication[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(CANDIDATE_APPLICATIONS_SELECT)
    .not('feedbacks.sent_to_candidate_at', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as CandidateApplicationRow[]).flatMap((row) => {
    const application = mapCandidateApplication(row);
    return application ? [application] : [];
  });
}