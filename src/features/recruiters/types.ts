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

// 'company' = recrutador ja aprovado, mas sem empresa vinculada (ex.: aprovado via SQL).
export type RecruiterGateState = 'approved' | 'company' | 'form' | 'pending';
