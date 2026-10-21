import { z } from 'zod';
import type { Json } from '../../shared/types/database';

export const TelemetryEventTypeSchema = z.enum([
  'score_seen',
  'swipe_decision',
  'application_submitted',
  // Funil do candidato (N84).
  'job_viewed',
  'profile_started',
  'profile_completed',
]);

// Origem do candidato no funil: veio pelo link da vaga ("?vaga=<id>") ou direto.
export const FunnelSourceSchema = z.enum(['job_link', 'direct']);

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
  mandatory_skills_met: z.boolean().optional(),
  source: FunnelSourceSchema.optional(),
});

// "Abriu a vaga": pelo link (vaga do link no topo do Swipe) ou pelo detalhe.
export const JobViewedMetadataSchema = z.object({
  job_id: z.string().uuid(),
  source: z.enum(['job_link', 'detail']),
});

// "Comecou o perfil" e "completou o perfil": uma vez por pessoa.
export const ProfileMilestoneMetadataSchema = z.object({
  source: FunnelSourceSchema,
  source_job_id: z.string().uuid().optional(),
});

export const EventLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid(),
  event_type: TelemetryEventTypeSchema,
  target_type: z.enum(['job', 'application', 'candidate']),
  target_id: z.string().uuid(),
  metadata: JsonSchema,
  created_at: z.string().datetime(),
});
