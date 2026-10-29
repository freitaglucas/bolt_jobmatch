import type { JobSkill } from '../../jobs/types';
import { MAX_SKILL_LEVEL } from '../../skills/levels';
import type { CandidateSkill, MatchFactor, MatchFactorGroup, MatchResult } from '../types';

const roundToTwoDecimals = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeSkillName = (name: string): string =>
  name.trim().toLocaleLowerCase();

interface ScoredItem {
  jobSkill: JobSkill;
  declaredLevel: number;
  candidateLevel: number;
  ratio: number;
}

interface ScoreUnit {
  weight: number;
  ratio: number;
  mandatory: boolean;
  missing: boolean;
}

// Mesma formula de public.calculate_application_match_score (paridade no CI).
// Item fora de grupo pesa como antes. Grupo de alternativas (N33) vale como um
// item: peso = maior peso, nota = media das group_min melhores notas;
// obrigatorio sem itens suficientes conta como obrigatorio ausente.
export function calculateMatch(
  jobSkills: JobSkill[],
  candidateSkills: CandidateSkill[],
): MatchResult {
  const candidateSkillsByName = new Map(
    candidateSkills.map((skill) => [normalizeSkillName(skill.skill_name), skill]),
  );

  const items: ScoredItem[] = jobSkills.map((jobSkill) => {
    const candidateSkill = candidateSkillsByName.get(
      normalizeSkillName(jobSkill.skill_name),
    );
    const declaredLevel = candidateSkill?.declared_level ?? 0;
    const candidateLevel = candidateSkill?.evidenced_by_project
      ? Math.min(MAX_SKILL_LEVEL, declaredLevel * 1.15)
      : declaredLevel;
    return {
      jobSkill,
      declaredLevel,
      candidateLevel,
      ratio: Math.min(candidateLevel / jobSkill.required_level, 1),
    };
  });

  const units: ScoreUnit[] = [];
  const groups = new Map<string, ScoredItem[]>();
  for (const item of items) {
    const groupId = item.jobSkill.group_id;
    if (groupId) {
      const current = groups.get(groupId) ?? [];
      current.push(item);
      groups.set(groupId, current);
      continue;
    }
    units.push({
      weight: item.jobSkill.weight,
      ratio: item.ratio,
      mandatory: item.jobSkill.mandatory,
      missing: item.candidateLevel === 0,
    });
  }

  const groupInfo = new Map<string, MatchFactorGroup>();
  for (const [groupId, members] of groups) {
    const needed = Math.min(
      Math.max(1, ...members.map((member) => member.jobSkill.group_min ?? 1)),
      members.length,
    );
    const best = members
      .map((member) => member.ratio)
      .sort((a, b) => b - a)
      .slice(0, needed);
    const present = members.filter((member) => member.candidateLevel > 0).length;
    const missing = present < needed;
    units.push({
      weight: Math.max(...members.map((member) => member.jobSkill.weight)),
      ratio: best.reduce((sum, ratio) => sum + ratio, 0) / needed,
      mandatory: members.some((member) => member.jobSkill.mandatory),
      missing,
    });
    groupInfo.set(groupId, { id: groupId, min: needed, size: members.length, met: !missing });
  }

  const totalWeight = units.reduce((sum, unit) => sum + unit.weight, 0);
  const totalPartialScore = units.reduce((sum, unit) => sum + unit.weight * unit.ratio, 0);
  const hasMissingMandatorySkill = units.some((unit) => unit.mandatory && unit.missing);

  const factors: MatchFactor[] = items.map((item) => {
    const factor: MatchFactor = {
      skill: item.jobSkill.skill_name,
      required: item.jobSkill.required_level,
      declared: item.declaredLevel,
      partial: roundToTwoDecimals(item.jobSkill.weight * item.ratio),
      gap: item.jobSkill.required_level - item.declaredLevel,
      mandatory: item.jobSkill.mandatory,
    };
    const group = item.jobSkill.group_id ? groupInfo.get(item.jobSkill.group_id) : undefined;
    return group ? { ...factor, group } : factor;
  });

  const baseScore =
    totalWeight === 0 ? 0 : (totalPartialScore / totalWeight) * 100;
  const finalScore = hasMissingMandatorySkill ? baseScore * 0.5 : baseScore;

  return {
    score: roundToTwoDecimals(finalScore),
    factors,
  };
}
