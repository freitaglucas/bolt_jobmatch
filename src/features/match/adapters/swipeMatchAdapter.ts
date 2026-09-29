import type { CandidateProfile, Job } from '../../../lib/types';
import type { JobSkill } from '../../jobs/types';
import { calculateMatch } from '../lib/calculateMatch';
import type { CandidateSkill, MatchResult } from '../types';

const MOCK_JOB_SKILL_WEIGHT = 1;

export function calculateSwipeMatch(
  job: Job,
  candidate: CandidateProfile,
): MatchResult {
  // TODO(mock): Replace the legacy UI model with persisted job_skills, including their real weights.
  const jobSkills: JobSkill[] = job.skills.map((skill, index) => ({
    id: `${job.id}-skill-${index}`,
    job_id: job.id,
    skill_name: skill.name,
    required_level: skill.level,
    weight: MOCK_JOB_SKILL_WEIGHT,
    mandatory: skill.mandatory,
  }));

  // TODO(mock): CandidateProfile does not yet store project evidence per skill.
  const candidateSkills: CandidateSkill[] = candidate.skills.map((skill) => ({
    skill_name: skill.name,
    declared_level: skill.level,
    evidenced_by_project: false,
  }));

  return calculateMatch(jobSkills, candidateSkills);
}
