import { z } from 'zod';
import { IMPORTANCE_VALUES } from './importance';
import { SENIORITY_VALUES } from './seniority';
import { JOB_ITEM_ROLES } from './item-roles';
import { MAX_SKILL_LEVEL, MIN_SKILL_LEVEL } from '../skills/levels';
import { MAX_GROUP_MIN, validateGroups } from './skill-groups';

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
  // Grupo de alternativas (N33): chave de um item de "groups".
  groupKey: z.string().min(1).max(20).optional(),
  importance: z
    .enum(IMPORTANCE_VALUES, {
      errorMap: () => ({ message: 'Escolha uma importância válida.' }),
    })
    .optional(),
});

export const MAX_JOB_REQUIREMENTS = 8;
export const MAX_SKILL_GROUPS = 5;

// Grupo de alternativas da vaga (N33): o candidato precisa de minCount itens.
export const JobSkillGroupInputSchema = z.object({
  key: z.string().min(1).max(20),
  minCount: z
    .number()
    .int('O mínimo do grupo deve ser um número inteiro.')
    .min(1, 'O mínimo do grupo é 1.')
    .max(MAX_GROUP_MIN, `O mínimo do grupo é no máximo ${MAX_GROUP_MIN}.`),
  role: z.enum(JOB_ITEM_ROLES, {
    errorMap: () => ({ message: 'Escolha o papel do grupo.' }),
  }),
});

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
  groups: z
    .array(JobSkillGroupInputSchema)
    .max(MAX_SKILL_GROUPS, `Crie no máximo ${MAX_SKILL_GROUPS} grupos de alternativas.`)
    .default([]),
}).superRefine((job, context) => {
  const problem = validateGroups(job.skills, job.groups);
  if (problem) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: problem, path: ['groups'] });
  }
});

export type CreateJobInput = z.input<typeof CreateJobSchema>;
export type CreateJobData = z.output<typeof CreateJobSchema>;
export type JobSkillInput = z.infer<typeof JobSkillInputSchema>;
export type JobRequirementInput = z.input<typeof JobRequirementInputSchema>;
export type JobSkillGroupInput = z.infer<typeof JobSkillGroupInputSchema>;
