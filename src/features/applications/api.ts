import { supabase } from '../../shared/lib/supabase';
import {
  mapCandidateApplication,
  type CandidateApplication,
  type CandidateApplicationRow,
} from './candidate-applications';
import {
  applyErrorMessage,
  parseApplyResult,
  toAnswersPayload,
  type ApplyResult,
  type RequirementAnswer,
} from './apply';

export type { CreatedApplication, RequirementAnswer } from './apply';

export type CreateApplicationResult = ApplyResult;

// Candidatura pela funcao apply_to_job (N31): grava a candidatura e as
// respostas aos requisitos da vaga numa unica chamada.
export async function createApplication(
  jobId: string,
  answers: RequirementAnswer[] = [],
): Promise<CreateApplicationResult> {
  const { data, error } = await supabase.rpc('apply_to_job', {
    _job_id: jobId,
    _answers: toAnswersPayload(answers),
  });

  if (error) {
    const friendly = applyErrorMessage(error);
    if (friendly) {
      throw new Error(friendly);
    }
    throw error;
  }

  return parseApplyResult(data);
}

export const CANDIDATE_APPLICATIONS_SELECT =
  'id, job_id, current_stage, match_score, created_at, feedback_deadlines(due_at, met_at, postpone_no), jobs(title, companies(name)), feedbacks(content, sent_to_candidate_at, created_at), application_stages(new_stage, created_at)';

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