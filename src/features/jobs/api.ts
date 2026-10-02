import { supabase } from '../../shared/lib/supabase';
import type { Job } from '../../lib/types';
import { toSeniority } from './seniority';

function formatPostedDate(createdAt: string): string {
  return `Publicado em ${new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(createdAt))}`;
}

export async function getActiveJobs(): Promise<Job[]> {
  const { data: jobRows, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (jobsError) {
    throw jobsError;
  }
  if (jobRows.length === 0) {
    return [];
  }

  const jobIds = jobRows.map((job) => job.id);
  const companyIds = [
    ...new Set(
      jobRows.flatMap((job) => job.company_id ? [job.company_id] : []),
    ),
  ];
  const { data: companyRows, error: companiesError } = companyIds.length
    ? await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds)
    : { data: [], error: null };

  if (companiesError) {
    throw companiesError;
  }

  const { data: jobSkillRows, error: jobSkillsError } = await supabase
    .from('job_skills')
    .select('*')
    .in('job_id', jobIds);

  if (jobSkillsError) {
    throw jobSkillsError;
  }

  const skillIds = [...new Set(jobSkillRows.map((skill) => skill.skill_id))];
  const { data: skillRows, error: skillsError } = skillIds.length
    ? await supabase.from('skills').select('id, name').in('id', skillIds)
    : { data: [], error: null };

  if (skillsError) {
    throw skillsError;
  }

  const companiesById = new Map(companyRows.map((company) => [company.id, company.name]));
  const skillsById = new Map(skillRows.map((skill) => [skill.id, skill.name]));
  const jobSkillsByJobId = new Map<string, typeof jobSkillRows>();

  for (const jobSkill of jobSkillRows) {
    const currentSkills = jobSkillsByJobId.get(jobSkill.job_id) ?? [];
    currentSkills.push(jobSkill);
    jobSkillsByJobId.set(jobSkill.job_id, currentSkills);
  }

  return jobRows.map((job) => {
    const skills = jobSkillsByJobId.get(job.id) ?? [];
    return {
      id: job.id,
      title: job.title,
      company: job.company_id
        ? companiesById.get(job.company_id) ?? 'Empresa'
        : 'Empresa',
      location: job.location,
      salary: job.salary_range ?? 'A combinar',
      type: job.employment_type,
      description: job.description,
      matchScore: 0,
      skills: skills.flatMap((jobSkill) => {
        const name = skillsById.get(jobSkill.skill_id);
        return name
          ? [{
              name,
              level: jobSkill.required_level,
              candidateLevel: 0,
              mandatory: jobSkill.mandatory,
              weight: jobSkill.weight,
            }]
          : [];
      }),
      posted: formatPostedDate(job.created_at),
      tags: skills.flatMap((jobSkill) => {
        const name = skillsById.get(jobSkill.skill_id);
        return name ? [name] : [];
      }),
      status: 'Ativa',
      seniority: toSeniority(job.seniority),
      candidatesCount: 0,
      newCandidatesCount: 0,
      interviewCount: 0,
    };
  });
}
