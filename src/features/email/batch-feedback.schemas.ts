import { z } from 'zod';

// Corpo do pedido e resposta da edge function send-email (template batch_feedback, N15a).

export const batchRequestItemSchema = z.object({
  application_id: z.string(),
  kind: z.enum(['decision', 'update']),
  message: z.string(),
  reason_code: z.string().optional(),
  new_due_at: z.string().optional(),
});
export type BatchRequestItem = z.infer<typeof batchRequestItemSchema>;

export const batchResponseItemSchema = z.object({
  application_id: z.string().nullable(),
  status: z.enum(['sent', 'failed', 'skipped_duplicate', 'skipped_limit']),
  error: z.string().optional(),
  in_app: z.boolean().optional(),
});
export type BatchResponseItem = z.infer<typeof batchResponseItemSchema>;

export const batchResponseSchema = z.object({
  sent: z.number(),
  failed: z.number(),
  skipped_duplicate: z.number(),
  skipped_limit: z.number(),
  results: z.array(batchResponseItemSchema),
});
export type BatchResponse = z.infer<typeof batchResponseSchema>;
