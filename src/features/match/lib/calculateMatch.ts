import type { JobSkill } from '../../jobs/types';
import type { CandidateSkill, MatchFactor, MatchResult } from '../types';

const roundToTwoDecimals = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeSkillName = (name: string): string =>
  name.trim().toLocaleLowerCase();

export function calculateMatch(
  jobSkills: JobSkill[],
  candidateSkills: CandidateSkill[],
): MatchResult {
  let totalWeight = 0;
  let totalPartialScore = 0;
  let hasMissingMandatorySkill = false;

  const candidateSkillsByName = new Map(
    candidateSkills.map((skill) => [normalizeSkillName(skill.skill_name), skill]),
  );

  const factors: MatchFactor[] = jobSkills.map((jobSkill) => {
    const candidateSkill = candidateSkillsByName.get(
      normalizeSkillName(jobSkill.skill_name),
    );
    const declaredLevel = candidateSkill?.declared_level ?? 0;
    const candidateLevel = candidateSkill?.evidenced_by_project
      ? Math.min(5, declaredLevel * 1.15)
      : declaredLevel;
    const partialScore =
      jobSkill.weight *
      Math.min(candidateLevel / jobSkill.required_level, 1);

    totalWeight += jobSkill.weight;
    totalPartialScore += partialScore;

    if (jobSkill.mandatory && candidateLevel === 0) {
      hasMissingMandatorySkill = true;
    }

    return {
      skill: jobSkill.skill_name,
      required: jobSkill.required_level,
      declared: declaredLevel,
      partial: roundToTwoDecimals(partialScore),
      gap: jobSkill.required_level - declaredLevel,
      mandatory: jobSkill.mandatory,
    };
  });

  const baseScore =
    totalWeight === 0 ? 0 : (totalPartialScore / totalWeight) * 100;
  const finalScore = hasMissingMandatorySkill ? baseScore * 0.5 : baseScore;

  return {
    score: roundToTwoDecimals(finalScore),
    factors,
  };
}
