import { supabase } from '../../shared/lib/supabase';
import { getRecruiterOnboarding } from '../recruiters/api';
import {
  CreateJobSchema,
  type CreateJobData,
  type CreateJobInput,
  type JobSkillGroupInput,
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
  group_id?: string;
}

export interface JobSkillGroupRow {
  id: string;
  job_id: string;
  min_count: number;
  role: JobItemRole;
}

// Grupos de alternativas (N33). O id nasce aqui para os itens apontarem para ele.
export function buildJobSkillGroupRows(
  jobId: string,
  groups: JobSkillGroupInput[],
  newId: () => string = () => crypto.randomUUID(),
): JobSkillGroupRow[] {
  return groups.map((group) => ({
    id: newId(),
    job_id: jobId,
    min_count: group.minCount,
    role: group.role,
  }));
}

export function buildJobSkillRows(
  jobId: string,
  skills: JobSkillInput[],
  groups: { key: string; row: JobSkillGroupRow }[] = [],
): JobSkillRow[] {
  const groupsByKey = new Map(groups.map((group) => [group.key, group.row]));
  return skills.map((skill) => {
    const group = skill.groupKey ? groupsByKey.get(skill.groupKey) : undefined;
    const role = group?.role ?? skill.role ?? roleFromMandatory(skill.mandatory ?? false);
    const row: JobSkillRow = {
      job_id: jobId,
      skill_id: skill.skillId,
      required_level: skill.requiredLevel,
      weight: weightForImportance(skill.importance),
      mandatory: isMandatoryRole(role),
      role,
    };
    return group ? { ...row, group_id: group.id } : row;
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

  const groupRows = buildJobSkillGroupRows(jobId, data.groups);
  if (groupRows.length > 0) {
    const { error: groupsError } = await supabase.from('job_skill_groups').insert(groupRows);
    if (groupsError) {
      await supabase.from('jobs').delete().eq('id', jobId);
      throw new Error('Não foi possível salvar os grupos de alternativas. Tente novamente.');
    }
  }

  const { error: skillsError } = await supabase
    .from('job_skills')
    .insert(
      buildJobSkillRows(
        jobId,
        data.skills,
        data.groups.map((group, index) => ({ key: group.key, row: groupRows[index] as JobSkillGroupRow })),
      ),
    );

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
