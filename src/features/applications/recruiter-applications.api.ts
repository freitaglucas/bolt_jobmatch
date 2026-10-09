import { supabase } from '../../shared/lib/supabase';
import type { ApplicationStatus } from '../../lib/types';
import type { RecruiterApplicationRow } from './recruiter-applications';
import { stageToDbStatus } from './recruiter-applications';

export const RECRUITER_APPLICATIONS_SELECT =
  'id, job_id, current_stage, match_score, created_at, silver_medalist, feedback_deadlines(due_at, met_at, postpone_no), jobs(title), candidate_profiles(current_position, seniority_general, location, years_of_experience, profiles(full_name))';

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

// Move a candidatura para outra etapa. A coluna liberada para update e
// current_stage (a mesma que o mapper le); o RLS limita as vagas do recrutador.
export async function moveApplicationStage(
  applicationId: string,
  stage: ApplicationStatus,
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ current_stage: stageToDbStatus(stage) })
    .eq('id', applicationId);

  if (error) {
    throw error;
  }
}

export interface SendFeedbackInput {
  applicationId: string;
  content: string;
}

// Registra o feedback do recrutador e marca a candidatura como respondida.
// O autor e o proprio recrutador autenticado (exigido pela policy de insert).
// No MVP o feedback vai para o candidato no mesmo momento em que e registrado.
export async function sendApplicationFeedback({
  applicationId,
  content,
}: SendFeedbackInput): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }
  if (!authData.user) {
    throw new Error('Entre na sua conta para registrar o feedback.');
  }

  const sentAt = new Date().toISOString();

  const { error: feedbackError } = await supabase.from('feedbacks').insert({
    application_id: applicationId,
    author_id: authData.user.id,
    content,
    sent_to_candidate_at: sentAt,
  });

  if (feedbackError) {
    throw feedbackError;
  }

  const { error: applicationError } = await supabase
    .from('applications')
    .update({ feedback_sent_at: sentAt })
    .eq('id', applicationId);

  if (applicationError) {
    throw applicationError;
  }
}
