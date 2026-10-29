export interface CandidateSkill {
  skill_name: string;
  declared_level: number;
  evidenced_by_project: boolean;
}

export interface MatchFactor {
  skill: string;
  required: number;
  declared: number;
  partial: number;
  gap: number;
  mandatory?: boolean;
  // Grupo de alternativas (N33): quantos o candidato precisa (min), quantos o
  // grupo tem (size) e se o candidato atende (met).
  group?: MatchFactorGroup;
}

export interface MatchFactorGroup {
  id: string;
  min: number;
  size: number;
  met: boolean;
}

export interface MatchResult {
  score: number;
  factors: MatchFactor[];
}
