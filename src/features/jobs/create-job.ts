import { supabase } from '../../shared/lib/supabase';
import { getRecruiterOnboarding } from '../recruiters/api';
import {
  CreateJobSchema,
  type CreateJobInput,
  type JobSkillInput,
} from './create-job.schema';

// Peso padrão de cada competência. O ajuste fino de pesos vem no item 2.3 (match-v2).
export const JOB_SKILL_DEFAULT_WEIGHT = 1;

export interface JobSkillRow {
  job_id: string;
  skill_id: string;
  required_level: number;
  weight: number;
  mandatory: boolean;
}

export function buildJobSkillRows(
  jobId: string,
  skills: JobSkillInput[],
): JobSkillRow[] {
  return skills.map((skill) => ({
    job_id: jobId,
    skill_id: skill.skillId,
    required_level: skill.requiredLevel,
    weight: JOB_SKILL_DEFAULT_WEIGHT,
    mandatory: skill.mandatory,
  }));
}

// Cria a vaga como rascunho, grava as competências e só então publica.
// Se as competências falharem, a vaga é apagada para não ficar pela metade.
export async function createJob(input: CreateJobInput): Promise<{ id: string }> {
  const data = CreateJobSchema.parse(input);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }
  if (!authData.user) {
    throw new Error('Entre na sua conta para publicar vagas.');
  }

  const recruiter = await getRecruiterOnboarding();
  if (!recruiter.companyId) {
    throw new Error('Complete o cadastro da sua empresa antes de publicar vagas.');
  }

  const { data: jobRow, error: jobError } = await supabase
    .from('jobs')
    .insert({
      recruiter_id: authData.user.id,
      company_id: recruiter.companyId,
      title: data.title,
      description: data.description,
      location: data.location,
      salary_range: data.salaryRange ?? null,
      employment_type: data.employmentType,
      status: 'draft',
    })
    .select('id')
    .single();

  if (jobError) {
    throw jobError;
  }

  const jobId = jobRow.id;

  const { error: skillsError } = await supabase
    .from('job_skills')
    .insert(buildJobSkillRows(jobId, data.skills));

  if (skillsError) {
    await supabase.from('jobs').delete().eq('id', jobId);
    throw new Error('Não foi possível salvar as competências da vaga. Tente novamente.');
  }

  const { error: activateError } = await supabase
    .from('jobs')
    .update({ status: 'active' })
    .eq('id', jobId);

  if (activateError) {
    throw activateError;
  }

  return { id: jobId };
}
