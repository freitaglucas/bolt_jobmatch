import { z } from 'zod';

export const ContractTypeSchema = z.enum(['CLT', 'PJ', 'Híbrido']);

export const WorkModelSchema = z.enum(['presencial', 'hibrido', 'remoto']);

export const SeniorityOptionSchema = z.enum([
  'Junior',
  'Pleno',
  'Senior',
  'Especialista',
]);

export const DeclaredLevelSchema = z.number().int().min(1).max(5);

export const CandidateSkillDraftSchema = z.object({
  skillId: z.string().uuid(),
  declaredLevel: DeclaredLevelSchema,
  evidencedByProject: z.boolean(),
});

export const CandidateSkillsSchema = z
  .array(CandidateSkillDraftSchema)
  .min(3, { message: 'Selecione pelo menos 3 competências.' });

export const DesiredPositionsSchema = z
  .array(z.string().trim().min(1, { message: 'Cargo não pode ser vazio.' }))
  .min(1, { message: 'Informe ao menos um cargo desejado.' });

export const SaveCandidateProfileSchema = z.object({
  fullName: z.string().trim().min(1, { message: 'Informe seu nome.' }),
  currentPosition: z.string().trim(),
  location: z.string().trim().min(1, { message: 'Informe sua localização.' }),
  phone: z.string().trim(),
  bio: z.string().trim(),
  desiredPositions: DesiredPositionsSchema,
  yearsOfExperience: z.number().min(0).max(80).nullable(),
  seniorityGeneral: SeniorityOptionSchema,
  acceptedContractTypes: z
    .array(ContractTypeSchema)
    .min(1, { message: 'Selecione ao menos um tipo de contrato.' }),
  acceptedWorkModels: z
    .array(WorkModelSchema)
    .min(1, { message: 'Selecione ao menos um modelo de trabalho.' }),
  willingToRelocate: z.boolean(),
  salaryExpectation: z.number().min(0).nullable(),
  skills: CandidateSkillsSchema,
});

export const CandidateIdentitySchema = SaveCandidateProfileSchema.pick({
  fullName: true,
  currentPosition: true,
  location: true,
  phone: true,
  bio: true,
});

export const CandidatePreferencesSchema = SaveCandidateProfileSchema.pick({
  desiredPositions: true,
  yearsOfExperience: true,
  seniorityGeneral: true,
  acceptedContractTypes: true,
  acceptedWorkModels: true,
  willingToRelocate: true,
  salaryExpectation: true,
});

