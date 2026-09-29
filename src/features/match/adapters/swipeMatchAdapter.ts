import type { Job } from '../../../lib/types';
import type { JobSkill } from '../../jobs/types';
import { calculateMatch } from '../lib/calculateMatch';
import type { CandidateSkill, MatchResult } from '../types';

export function calculateSwipeMatch(
  job: Job,
  candidateSkills: CandidateSkill[],
): MatchResult {
  const jobSkills: JobSkill[] = job.skills.map((skill, index) => ({
    id: `${job.id}-skill-${index}`,
    job_id: job.id,
    skill_name: skill.name,
    required_level: skill.level,
    // TODO(mock): Remove fallback when legacy fixture-based Job values are retired.
    weight: skill.weight ?? 1,
    mandatory: skill.mandatory,
  }));

  return calculateMatch(jobSkills, candidateSkills);
}
