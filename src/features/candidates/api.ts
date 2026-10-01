import { supabase } from '../../shared/lib/supabase';
import type { CandidateSkill } from '../match/types';
import { SaveCandidateProfileSchema } from './schemas';
import type {
  CandidateProfile,
  CandidateSkillDraft,
  CandidateSkillSelection,
  SaveCandidateProfileInput,
  SeniorityOption,
  WorkModel,
} from './types';

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

const SENIORITY_OPTIONS: readonly string[] = [
  'Junior',
  'Pleno',
  'Senior',
  'Especialista',
];

function toSeniorityOption(value: string | null): SeniorityOption | null {
  return value && SENIORITY_OPTIONS.includes(value)
    ? (value as SeniorityOption)
    : null;
}

function toWorkModels(value: string[] | null | undefined): WorkModel[] {
  const allowed: WorkModel[] = ['presencial', 'hibrido', 'remoto'];
  return (value ?? []).filter((model): model is WorkModel =>
    allowed.includes(model as WorkModel),
  );
}

export async function getMyCandidateSkills(
  userId: string,
): Promise<CandidateSkillSelection[]> {
  const { data: candidateSkillRows, error: candidateSkillsError } = await supabase
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
    .select('id, name, category')
    .in('id', skillIds);

  if (skillsError) {
    throw skillsError;
  }

  const skillById = new Map(skills.map((skill) => [skill.id, skill]));
  return candidateSkillRows.flatMap((candidateSkill) => {
    const skill = skillById.get(candidateSkill.skill_id);
    return skill
      ? [
          {
            skillId: candidateSkill.skill_id,
            name: skill.name,
            category: skill.category,
            declaredLevel: candidateSkill.declared_level,
            evidencedByProject: candidateSkill.evidenced_by_project,
          },
        ]
      : [];
  });
}

export async function getMyCandidateProfile(): Promise<CandidateProfile> {
  const userId = await getAuthenticatedUserId();

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const { data: candidateRow, error: candidateError } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (candidateError) {
    throw candidateError;
  }

  const { data: prefsRow, error: prefsError } = await supabase
    .from('candidate_private_preferences')
    .select('salary_expectation')
    .eq('user_id', userId)
    .maybeSingle();

  if (prefsError) {
    throw prefsError;
  }

  const skills = await getMyCandidateSkills(userId);

  return {
    fullName: profileRow?.full_name ?? '',
    currentPosition: candidateRow?.current_position ?? '',
    location: candidateRow?.location ?? '',
    phone: candidateRow?.phone ?? '',
    bio: candidateRow?.bio ?? '',
    desiredPositions: candidateRow?.desired_positions ?? [],
    yearsOfExperience: candidateRow?.years_of_experience ?? null,
    seniorityGeneral: toSeniorityOption(candidateRow?.seniority_general ?? null),
    acceptedContractTypes: candidateRow?.accepted_contract_types ?? [],
    acceptedWorkModels: toWorkModels(candidateRow?.accepted_work_models),
    willingToRelocate: candidateRow?.willing_to_relocate ?? false,
    salaryExpectation: prefsRow?.salary_expectation ?? null,
    skills,
  };
}

export function isCandidateProfileComplete(profile: CandidateProfile): boolean {
  return (
    profile.fullName.trim().length > 0 &&
    profile.location.trim().length > 0 &&
    profile.skills.length >= 3
  );
}


async function replaceMyCandidateSkills(
  userId: string,
  skills: CandidateSkillDraft[],
): Promise<void> {
  const { data: existingRows, error: selectError } = await supabase
    .from('candidate_skills')
    .select('skill_id')
    .eq('candidate_id', userId);

  if (selectError) {
    throw selectError;
  }

  const incomingIds = new Set(skills.map((skill) => skill.skillId));
  const staleIds = (existingRows ?? [])
    .map((row) => row.skill_id)
    .filter((skillId) => !incomingIds.has(skillId));

  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('candidate_skills')
      .delete()
      .eq('candidate_id', userId)
      .in('skill_id', staleIds);

    if (deleteError) {
      throw deleteError;
    }
  }

  if (skills.length > 0) {
    const { error: upsertError } = await supabase
      .from('candidate_skills')
      .upsert(
        skills.map((skill) => ({
          candidate_id: userId,
          skill_id: skill.skillId,
          declared_level: skill.declaredLevel,
          evidenced_by_project: skill.evidencedByProject,
        })),
        { onConflict: 'candidate_id,skill_id' },
      );

    if (upsertError) {
      throw upsertError;
    }
  }
}

export async function saveMyCandidateProfile(
  input: SaveCandidateProfileInput,
): Promise<void> {
  const validated = SaveCandidateProfileSchema.parse(input);
  const userId = await getAuthenticatedUserId();

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: validated.fullName })
    .eq('id', userId);

  if (profileError) {
    throw profileError;
  }

  const { error: candidateError } = await supabase
    .from('candidate_profiles')
    .upsert(
      {
        user_id: userId,
        current_position: validated.currentPosition || null,
        location: validated.location,
        phone: validated.phone || null,
        bio: validated.bio || null,
        desired_positions: validated.desiredPositions,
        years_of_experience: validated.yearsOfExperience,
        seniority_general: validated.seniorityGeneral,
        accepted_contract_types: validated.acceptedContractTypes,
        accepted_work_models: validated.acceptedWorkModels,
        willing_to_relocate: validated.willingToRelocate,
      },
      { onConflict: 'user_id' },
    );

  if (candidateError) {
    throw candidateError;
  }

  const { error: prefsError } = await supabase
    .from('candidate_private_preferences')
    .upsert(
      {
        user_id: userId,
        salary_expectation: validated.salaryExpectation,
      },
      { onConflict: 'user_id' },
    );

  if (prefsError) {
    throw prefsError;
  }

  await replaceMyCandidateSkills(userId, validated.skills);
}

