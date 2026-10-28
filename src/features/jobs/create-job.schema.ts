import { z } from 'zod';
import { IMPORTANCE_VALUES } from './importance';
import { SENIORITY_VALUES } from './seniority';
import { JOB_ITEM_ROLES } from './item-roles';
import { MAX_SKILL_LEVEL, MIN_SKILL_LEVEL } from '../skills/levels';

export const EMPLOYMENT_TYPES = ['CLT', 'PJ', 'Híbrido'] as const;

export const JobSkillInputSchema = z.object({
  skillId: z.string().uuid('Competência inválida.'),
  requiredLevel: z
    .number()
    .int('O nível deve ser um número inteiro.')
    .min(MIN_SKILL_LEVEL, 'O nível mínimo é básico.')
    .max(MAX_SKILL_LEVEL, 'O nível máximo é avançado.'),
  // Papel na vaga (N31). Sem papel, vale o antigo obrigatorio sim/nao.
  role: z
    .enum(JOB_ITEM_ROLES, {
      errorMap: () => ({ message: 'Escolha obrigatório, desejável ou implícito.' }),
    })
    .optional(),
  mandatory: z.boolean().optional(),
  importance: z
    .enum(IMPORTANCE_VALUES, {
      errorMap: () => ({ message: 'Escolha uma importância válida.' }),
    })
    .optional(),
});

export const MAX_JOB_REQUIREMENTS = 8;

// Requisito sim/nao da vaga (N31). eliminatory = excludente: quem responde nao
// e recusado na hora, com retorno de motivo.
export const JobRequirementInputSchema = z.object({
  skillId: z.string().uuid('Requisito inválido.'),
  detail: z
    .string()
    .trim()
    .max(200, 'O detalhe do requisito pode ter no máximo 200 caracteres.')
    .optional()
    .transform((value) => (value ? value : undefined)),
  eliminatory: z.boolean(),
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
  seniority: z
    .enum(SENIORITY_VALUES, {
      errorMap: () => ({ message: 'Escolha um nível de senioridade válido.' }),
    })
    .optional(),
  skills: z
    .array(JobSkillInputSchema)
    .min(1, 'Adicione pelo menos uma competência.')
    .max(15, 'Adicione no máximo 15 competências.')
    .refine(
      (skills) => new Set(skills.map((skill) => skill.skillId)).size === skills.length,
      'A mesma competência foi adicionada mais de uma vez.',
    ),
  requirements: z
    .array(JobRequirementInputSchema)
    .max(MAX_JOB_REQUIREMENTS, `Adicione no máximo ${MAX_JOB_REQUIREMENTS} requisitos.`)
    .refine(
      (items) => new Set(items.map((item) => item.skillId)).size === items.length,
      'O mesmo requisito foi adicionado mais de uma vez.',
    )
    .default([]),
});

export type CreateJobInput = z.input<typeof CreateJobSchema>;
export type CreateJobData = z.output<typeof CreateJobSchema>;
export type JobSkillInput = z.infer<typeof JobSkillInputSchema>;
export type JobRequirementInput = z.input<typeof JobRequirementInputSchema>;
