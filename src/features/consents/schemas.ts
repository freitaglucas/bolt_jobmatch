import { z } from 'zod';

export const ConsentTypeSchema = z.enum(['tcle']);

export const ConsentInsertSchema = z.object({
  consent_type: ConsentTypeSchema,
  policy_version: z.string().trim().min(1),
});

export type ConsentInsert = z.infer<typeof ConsentInsertSchema>;
