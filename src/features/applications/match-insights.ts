import {
  buildMatchInsights,
  type CandidateSkillInput,
  type JobSkillInput,
  type MatchInsights,
} from './rejection-reasons';

// Linhas como vem do banco (applications, job_skills, candidate_skills, skills).
export interface InsightsSourceRows {
  applications: { id: string; job_id: string; candidate_id: string }[];
  jobSkills: {
    job_id: string;
    skill_id: string;
    required_level: number;
    weight: number | string;
    mandatory: boolean;
    group_id?: string | null;
  }[];
  // Grupos de alternativas (N33).
  groups?: { id: string; min_count: number }[];
  candidateSkills: { candidate_id: string; skill_id: string; declared_level: number }[];
  skills: { id: string; name: string }[];
}

// Lacunas e pontos fortes de cada candidatura (chave = applications.id).
export function buildInsightsByApplication(
  rows: InsightsSourceRows,
): Record<string, MatchInsights> {
  const skillNames = new Map(rows.skills.map((skill) => [skill.id, skill.name]));
  const groupMins = new Map((rows.groups ?? []).map((group) => [group.id, group.min_count]));

  const jobSkillsByJob = new Map<string, JobSkillInput[]>();
  for (const row of rows.jobSkills) {
    const name = skillNames.get(row.skill_id);
    if (!name) {
      continue;
    }
    const list = jobSkillsByJob.get(row.job_id) ?? [];
    list.push({
      skillName: name,
      requiredLevel: Number(row.required_level),
      weight: Number(row.weight),
      mandatory: row.mandatory,
      groupId: row.group_id ?? null,
      groupMin: row.group_id ? (groupMins.get(row.group_id) ?? 1) : undefined,
    });
    jobSkillsByJob.set(row.job_id, list);
  }

  const candidateSkillsByCandidate = new Map<string, CandidateSkillInput[]>();
  for (const row of rows.candidateSkills) {
    const name = skillNames.get(row.skill_id);
    if (!name) {
      continue;
    }
    const list = candidateSkillsByCandidate.get(row.candidate_id) ?? [];
    list.push({ skillName: name, declaredLevel: Number(row.declared_level) });
    candidateSkillsByCandidate.set(row.candidate_id, list);
  }

  const result: Record<string, MatchInsights> = {};
  for (const application of rows.applications) {
    result[application.id] = buildMatchInsights(
      jobSkillsByJob.get(application.job_id) ?? [],
      candidateSkillsByCandidate.get(application.candidate_id) ?? [],
    );
  }
  return result;
}
