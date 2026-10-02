import { supabase } from '../../shared/lib/supabase';
import type { Job } from '../../lib/types';

export type JobStatusValue = 'draft' | 'active' | 'paused' | 'closed';

const STATUS_LABELS: Record<JobStatusValue, Job['status']> = {
  draft: 'Rascunho',
  active: 'Ativa',
  paused: 'Pausada',
  closed: 'Fechada',
};

const EMPLOYMENT_TYPES: Job['type'][] = ['CLT', 'PJ', 'Híbrido'];

export interface RecruiterJobRow {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_range: string | null;
  employment_type: string;
  status: string;
  created_at: string;
  applications: { current_stage: string }[] | null;
}

function toEmploymentType(value: string): Job['type'] {
  return EMPLOYMENT_TYPES.find((type) => type === value) ?? 'CLT';
}

// Converte a linha do banco para o formato que a tela de vagas já usa.
export function mapRecruiterJob(row: RecruiterJobRow, companyName: string): Job {
  const applications = (row.applications ?? []).filter(
    (application) => application.current_stage !== 'withdrawn',
  );

  return {
    id: row.id,
    title: row.title,
    company: companyName,
    location: row.location,
    salary: row.salary_range ?? 'A combinar',
    type: toEmploymentType(row.employment_type),
    description: row.description,
    matchScore: 0,
    skills: [],
    posted: new Date(row.created_at).toLocaleDateString('pt-BR'),
    tags: [],
    status: STATUS_LABELS[row.status as JobStatusValue] ?? 'Rascunho',
    candidatesCount: applications.length,
    newCandidatesCount: applications.filter(
      (application) => application.current_stage === 'new_application',
    ).length,
    interviewCount: applications.filter(
      (application) =>
        application.current_stage === 'interview' ||
        application.current_stage === 'final_interview',
    ).length,
  };
}

export function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23503'
  );
}

export async function listRecruiterJobs(): Promise<RecruiterJobRow[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }
  if (!authData.user) {
    throw new Error('Entre na sua conta para ver suas vagas.');
  }

  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, title, description, location, salary_range, employment_type, status, created_at, applications(current_stage)',
    )
    .eq('recruiter_id', authData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as RecruiterJobRow[];
}

export async function setJobStatus(jobId: string, status: JobStatusValue): Promise<void> {
  const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId);
  if (error) {
    throw error;
  }
}

export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId);
  if (error) {
    throw error;
  }
}
