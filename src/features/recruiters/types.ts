export interface RecruiterOnboardingProfile {
  companyId: string | null;
  companyName: string | null;
  position: string;
  phone: string;
  approvedAt: string | null;
}

export interface SaveRecruiterOnboardingInput {
  companyName: string;
  position: string;
  phone: string;
}

export type RecruiterGateState = 'approved' | 'form' | 'pending';
