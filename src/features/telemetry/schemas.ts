import { z } from 'zod';
import type { Json } from '../../shared/types/database';

export const TelemetryEventTypeSchema = z.enum(['score_seen', 'swipe_decision', 'application_submitted']);

const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonSchema),
    z.record(z.string(), JsonSchema),
  ])
);

export const ScoreSeenMetadataSchema = z.object({
  job_id: z.string().uuid(),
  score: z.number().min(0).max(100),
});

export const SwipeDecisionMetadataSchema = z.object({
  job_id: z.string().uuid(),
  action: z.enum(['like', 'pass']),
  score: z.number().min(0).max(100),
});

export const ApplicationSubmittedMetadataSchema = z.object({
  job_id: z.string().uuid(),
  score: z.number().min(0).max(100),
  mandatory_skills_met: z.boolean(),
});

export const EventLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid(),
  event_type: TelemetryEventTypeSchema,
  target_type: z.string().min(1),
  target_id: z.string().uuid(),
  metadata: JsonSchema,
  created_at: z.string().datetime(),
});
