import { z } from 'zod';

export const EMPLOYMENT_TYPES = ['CLT', 'PJ', 'Híbrido'] as const;

export const JobSkillInputSchema = z.object({
  skillId: z.string().uuid('Competência inválida.'),
  requiredLevel: z
    .number()
    .int('O nível deve ser um número inteiro.')
    .min(1, 'O nível mínimo é 1.')
    .max(5, 'O nível máximo é 5.'),
  mandatory: z.boolean(),
});

export const CreateJobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'O título precisa ter pelo menos 3 caracteres.')
    .max(120, 'O título pode ter no máximo 120 caracteres.'),
  location: z
    .string()
    .trim()
    .min(2, 'Informe a localização.')
    .max(120, 'A localização pode ter no máximo 120 caracteres.'),
  description: z
    .string()
    .trim()
    .min(20, 'A descrição precisa ter pelo menos 20 caracteres.')
    .max(5000, 'A descrição pode ter no máximo 5000 caracteres.'),
  salaryRange: z
    .string()
    .trim()
    .max(60, 'A faixa salarial pode ter no máximo 60 caracteres.')
    .optional()
    .transform((value) => (value ? value : undefined)),
  employmentType: z.enum(EMPLOYMENT_TYPES, {
    errorMap: () => ({ message: 'Escolha um tipo de contratação válido.' }),
  }),
  skills: z
    .array(JobSkillInputSchema)
    .min(1, 'Adicione pelo menos uma competência.')
    .max(15, 'Adicione no máximo 15 competências.')
    .refine(
      (skills) => new Set(skills.map((skill) => skill.skillId)).size === skills.length,
      'A mesma competência foi adicionada mais de uma vez.',
    ),
});

export type CreateJobInput = z.input<typeof CreateJobSchema>;
export type CreateJobData = z.output<typeof CreateJobSchema>;
export type JobSkillInput = z.infer<typeof JobSkillInputSchema>;
