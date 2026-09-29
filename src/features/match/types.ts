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
}

export interface MatchResult {
  score: number;
  factors: MatchFactor[];
}
