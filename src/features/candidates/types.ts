import type { Database } from '../../shared/types/database';

export type ContractType = Database['public']['Enums']['employment_type'];

export type WorkModel = 'presencial' | 'hibrido' | 'remoto';

export type SeniorityOption = 'Junior' | 'Pleno' | 'Senior' | 'Especialista';

export interface CandidateSkillDraft {
  skillId: string;
  declaredLevel: number;
  evidencedByProject: boolean;
}

export interface CandidateSkillSelection extends CandidateSkillDraft {
  name: string;
  category: 'hard' | 'soft';
}

export interface CandidateProfileData {
  fullName: string;
  currentPosition: string;
  location: string;
  phone: string;
  bio: string;
  desiredPositions: string[];
  yearsOfExperience: number | null;
  seniorityGeneral: SeniorityOption | null;
  acceptedContractTypes: ContractType[];
  acceptedWorkModels: WorkModel[];
  willingToRelocate: boolean;
  salaryExpectation: number | null;
}

export interface CandidateProfile extends CandidateProfileData {
  skills: CandidateSkillSelection[];
}

export interface SaveCandidateProfileInput extends CandidateProfileData {
  skills: CandidateSkillDraft[];
}

