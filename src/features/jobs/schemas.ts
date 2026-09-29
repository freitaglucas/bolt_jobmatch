import { z } from 'zod';

export const JobSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string(),
  salary_range: z.string(),
  employment_type: z.enum(['CLT', 'PJ', 'Híbrido']),
  description: z.string(),
  status: z.enum(['Rascunho', 'Ativa', 'Pausada', 'Fechada']),
  created_at: z.string().datetime(),
});

export const JobSkillSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().uuid(),
  skill_name: z.string().min(1),
  required_level: z.number().int().min(1).max(5),
  weight: z.number().min(0).max(10),
  mandatory: z.boolean(),
});
