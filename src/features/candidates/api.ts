import { supabase } from '../../shared/lib/supabase';
import type { CandidateSkill } from '../match/types';

export interface CandidateProfileSkill extends CandidateSkill {
  skill_id: string;
}

export interface SkillCatalogEntry {
  id: string;
  name: string;
  category: 'hard' | 'soft';
}

async function getAuthenticatedUserId(): Promise<string> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }
  if (!authData.user) {
    throw new Error('Entre na sua conta para carregar suas competências.');
  }
  return authData.user.id;
}

export async function getMyMatchSkills(): Promise<CandidateProfileSkill[]> {
  const userId = await getAuthenticatedUserId();
  const { data: candidateSkillRows, error: candidateSkillsError } =
    await supabase
      .from('candidate_skills')
      .select('skill_id, declared_level, evidenced_by_project')
      .eq('candidate_id', userId);

  if (candidateSkillsError) {
    throw candidateSkillsError;
  }
  if (candidateSkillRows.length === 0) {
    return [];
  }

  const skillIds = candidateSkillRows.map((skill) => skill.skill_id);
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('id, name')
    .in('id', skillIds);

  if (skillsError) {
    throw skillsError;
  }

  const skillNames = new Map(skills.map((skill) => [skill.id, skill.name]));
  return candidateSkillRows.flatMap((candidateSkill) => {
    const skillName = skillNames.get(candidateSkill.skill_id);
    return skillName
      ? [{
          skill_name: skillName,
          skill_id: candidateSkill.skill_id,
          declared_level: candidateSkill.declared_level,
          evidenced_by_project: candidateSkill.evidenced_by_project,
        }]
      : [];
  });
}

export async function getSkillCatalog(): Promise<SkillCatalogEntry[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, category')
    .order('name');

  if (error) {
    throw error;
  }

  return data;
}

export async function saveMyCandidateSkill(input: {
  skillId: string;
  declaredLevel: number;
  evidencedByProject: boolean;
}): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const { error } = await supabase
    .from('candidate_skills')
    .upsert(
      {
        candidate_id: userId,
        skill_id: input.skillId,
        declared_level: input.declaredLevel,
        evidenced_by_project: input.evidencedByProject,
      },
      { onConflict: 'candidate_id,skill_id' },
    );

  if (error) {
    throw error;
  }
}

export async function removeMyCandidateSkill(skillId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const { error } = await supabase
    .from('candidate_skills')
    .delete()
    .eq('candidate_id', userId)
    .eq('skill_id', skillId);

  if (error) {
    throw error;
  }
}
