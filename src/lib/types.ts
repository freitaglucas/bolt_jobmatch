import type { SeniorityValue } from '../features/jobs/seniority';

export type Role = 'candidate' | 'recruiter';

export type Seniority = 'Junior' | 'Pleno' | 'Senior' | 'Especialista';

export type SkillStatus = 'match' | 'gap' | 'missing';

export interface SkillRequirement {
  name: string;
  level: number; // 1-5 required level
  candidateLevel: number; // 0 = missing, 1-5 = has it
  mandatory: boolean;
  weight?: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: 'CLT' | 'PJ' | 'Híbrido';
  description: string;
  matchScore: number;
  skills: SkillRequirement[];
  posted: string;
  tags: string[];
  status: 'Rascunho' | 'Ativa' | 'Pausada' | 'Fechada';
  candidatesCount: number;
  newCandidatesCount: number;
  interviewCount: number;
  hire?: HireInfo;
  seniority?: SeniorityValue | null;
}

export interface HireInfo {
  candidateName: string;
  candidateAvatarColor: string;
  matchScore: number;
  hireDate: string;
  timeToHireDays: number;
  costPerHire: number;
  salaryNegotiated: string;
  tokensEarned: number;
}

export type PostHirePhase = 'Onboarding' | '30 dias' | '60 dias' | '90 dias' | 'Confirmado';

export type CheckpointStatus = 'completed' | 'in_progress' | 'pending' | 'at_risk';

export interface PostHireCheckpoint {
  phase: PostHirePhase;
  label: string;
  status: CheckpointStatus;
  date: string;
  notes: string;
  rating?: number;
}

export interface PostHireRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  candidateName: string;
  candidateAvatarColor: string;
  matchScore: number;
  hireDate: string;
  daysSinceHire: number;
  currentPhase: PostHirePhase;
  onboardingProgress: number;
  performanceRating: number;
  manager: string;
  checkpoints: PostHireCheckpoint[];
  feedback: PostHireFeedback[];
}

export interface PostHireFeedback {
  author: string;
  text: string;
  date: string;
}

export type ApplicationStatus =
  | 'Em análise'
  | 'Triagem'
  | 'Entrevista'
  | 'Final'
  | 'Aprovado'
  | 'Rejeitado';

// Feedback do recrutador ja enviado ao candidato: texto + data do envio.
export interface ApplicationFeedback {
  content: string;
  sentAt: string;
}

export interface TimelineStep {
  label: string;
  date: string;
  done: boolean;
  status: ApplicationStatus;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedDate: string;
  matchScore: number;
  timeline: TimelineStep[];
  feedback?: ApplicationFeedback;
}

export interface CandidateSkill {
  name: string;
  level: number; // 1-5
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string; // YYYY-MM
  endDate: string | null; // null = current
  current: boolean;
  description: string;
  competencies: string[];
}

export interface CandidateProfile {
  name: string;
  role: string;
  seniority: Seniority;
  email: string;
  location: string;
  bio: string;
  skills: CandidateSkill[];
  workExperiences: WorkExperience[];
  projects: { title: string; description: string; link: string }[];
  links: { label: string; url: string }[];
}

export interface PipelineCandidate {
  id: string; // candidatura (applications.id) quando vem do banco
  name: string;
  role: string;
  seniority: string; // texto livre do perfil do candidato
  matchScore: number;
  appliedDate: string;
  stage: ApplicationStatus;
  avatarColor: string;
  jobId?: string;
  jobTitle?: string;
  location?: string | null;
  yearsOfExperience?: number | null;
  silverMedalist?: boolean;
  lastStageChangeAt?: string; // base do prazo de retorno (SLA)
  feedbackSentAt?: string | null; // ultimo retorno enviado ao candidato
}

export interface TokenEvent {
  id: string;
  action: string;
  amount: number;
  date: string;
  type: 'earn' | 'spend';
}
