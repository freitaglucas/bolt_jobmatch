import { supabase } from '../../shared/lib/supabase';
import { getRecruiterOnboarding } from '../recruiters/api';
import {
  CreateJobSchema,
  type CreateJobData,
  type CreateJobInput,
  type JobSkillInput,
} from './create-job.schema';
import { DEFAULT_IMPORTANCE, weightForImportance } from './importance';
import { isMandatoryRole, roleFromMandatory, type JobItemRole } from './item-roles';

// Peso padrão de uma competência (importância Alta). O recrutador pode baixar
// para Média (0,75) ou Baixa (0,5) na criação da vaga (item 2.3a).
export const JOB_SKILL_DEFAULT_WEIGHT = weightForImportance(DEFAULT_IMPORTANCE);

export interface JobSkillRow {
  job_id: string;
  skill_id: string;
  required_level: number;
  weight: number;
  mandatory: boolean;
  role: JobItemRole;
}

export function buildJobSkillRows(
  jobId: string,
  skills: JobSkillInput[],
): JobSkillRow[] {
  return skills.map((skill) => {
    const role = skill.role ?? roleFromMandatory(skill.mandatory ?? false);
    return {
      job_id: jobId,
      skill_id: skill.skillId,
      required_level: skill.requiredLevel,
      weight: weightForImportance(skill.importance),
      mandatory: isMandatoryRole(role),
      role,
    };
  });
}

export interface JobRequirementRow {
  job_id: string;
  skill_id: string;
  detail: string | null;
  eliminatory: boolean;
}

export function buildJobRequirementRows(
  jobId: string,
  requirements: CreateJobData['requirements'],
): JobRequirementRow[] {
  return requirements.map((requirement) => ({
    job_id: jobId,
    skill_id: requirement.skillId,
    detail: requirement.detail ?? null,
    eliminatory: requirement.eliminatory,
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
      seniority: data.seniority ?? null,
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

  if (data.requirements.length > 0) {
    const { error: requirementsError } = await supabase
      .from('job_requirements')
      .insert(buildJobRequirementRows(jobId, data.requirements));

    if (requirementsError) {
      await supabase.from('jobs').delete().eq('id', jobId);
      throw new Error('Não foi possível salvar os requisitos da vaga. Tente novamente.');
    }
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
