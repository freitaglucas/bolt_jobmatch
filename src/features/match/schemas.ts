import { z } from 'zod';

export const MatchFactorSchema = z.object({
  skill: z.string().min(1),
  required: z.number().int().min(1).max(5),
  declared: z.number().int().min(0).max(5),
  partial: z.number().min(0).max(100),
  gap: z.number().min(-5).max(5),
  mandatory: z.boolean().optional(),
});

export const MatchResultSchema = z.object({
  score: z.number().min(0).max(100),
  factors: z.array(MatchFactorSchema),
});
