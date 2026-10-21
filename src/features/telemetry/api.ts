import { z } from 'zod';
import { supabase } from '../../shared/lib/supabase';
import {
  ApplicationSubmittedMetadataSchema,
  EventLogSchema,
  JobViewedMetadataSchema,
  ProfileMilestoneMetadataSchema,
  ScoreSeenMetadataSchema,
  SwipeDecisionMetadataSchema,
} from './schemas';
import type { FunnelSourceMetadata } from './origin';
import type { Json } from '../../shared/types/database';

const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const UUIDSchema = z.string().uuid();

function getTelemetrySessionId(): string {
  const now = Date.now();
  const storedSession = localStorage.getItem('job-match-telemetry-session');

  if (storedSession) {
    let stored: unknown;
    try {
      stored = JSON.parse(storedSession);
    } catch {
      stored = null;
    }
    const parsed = z
      .object({
        id: UUIDSchema,
        lastActivityAt: z.number(),
      })
      .safeParse(stored);

    if (
      parsed.success &&
      now - parsed.data.lastActivityAt < SESSION_IDLE_TIMEOUT_MS
    ) {
      localStorage.setItem(
        'job-match-telemetry-session',
        JSON.stringify({ id: parsed.data.id, lastActivityAt: now }),
      );
      return parsed.data.id;
    }
  }

  const id = crypto.randomUUID();
  localStorage.setItem(
    'job-match-telemetry-session',
    JSON.stringify({ id, lastActivityAt: now }),
  );
  return id;
}

// "Comecou/completou o perfil" contam uma vez por pessoa (indice unico, N84):
// a repeticao volta como 23505 e e ignorada.
export function isRepeatedMilestone(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === '23505'
  );
}

async function insertEvent(
  eventType: 'job_viewed' | 'profile_started' | 'profile_completed',
  targetType: 'job' | 'candidate',
  targetId: string | null,
  metadata: NonNullable<Json>,
): Promise<void> {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }
  if (!data.user) {
    return;
  }

  const event = EventLogSchema.parse({
    id: crypto.randomUUID(),
    user_id: data.user.id,
    session_id: getTelemetrySessionId(),
    event_type: eventType,
    target_type: targetType,
    target_id: targetId ?? data.user.id,
    metadata,
    created_at: new Date().toISOString(),
  });

  const { error } = await supabase.from('event_log').insert({
    user_id: event.user_id,
    session_id: event.session_id,
    event_type: event.event_type,
    target_type: event.target_type,
    target_id: event.target_id,
    metadata,
  });

  if (error && !isRepeatedMilestone(error)) {
    throw error;
  }
}

// "Abriu a vaga" (N84).
export function trackJobViewed(jobId: string, source: 'job_link' | 'detail'): Promise<void> {
  const metadata = JobViewedMetadataSchema.parse({ job_id: jobId, source });
  return insertEvent('job_viewed', 'job', jobId, metadata);
}

// "Comecou o perfil" (N84): o formulario do perfil apareceu pela primeira vez.
export function trackProfileStarted(origin: FunnelSourceMetadata): Promise<void> {
  const metadata = ProfileMilestoneMetadataSchema.parse(origin);
  return insertEvent('profile_started', 'candidate', null, metadata);
}

// "Completou o perfil" (N84): o perfil ficou completo e o app liberou.
export function trackProfileCompleted(origin: FunnelSourceMetadata): Promise<void> {
  const metadata = ProfileMilestoneMetadataSchema.parse(origin);
  return insertEvent('profile_completed', 'candidate', null, metadata);
}

async function insertSwipeEvent(
  eventType: 'score_seen' | 'swipe_decision' | 'application_submitted',
  jobId: string,
  score: number,
  extraMetadata?:
    | { action: 'like' | 'pass' }
    | { mandatory_skills_met?: boolean; source?: 'job_link' | 'direct' },
): Promise<void> {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }
  if (!data.user) {
    return;
  }

  const metadata = { job_id: jobId, score, ...extraMetadata };
  const metadataSchema =
    eventType === 'score_seen'
      ? ScoreSeenMetadataSchema
      : eventType === 'swipe_decision'
        ? SwipeDecisionMetadataSchema
        : ApplicationSubmittedMetadataSchema;
  const parsedMetadata = metadataSchema.parse(metadata);
  const event = EventLogSchema.parse({
    id: crypto.randomUUID(),
    user_id: data.user.id,
    session_id: getTelemetrySessionId(),
    event_type: eventType,
    target_type: 'job',
    target_id: jobId,
    metadata: parsedMetadata,
    created_at: new Date().toISOString(),
  });

  const { error } = await supabase.from('event_log').insert({
    user_id: event.user_id,
    session_id: event.session_id,
    event_type: event.event_type,
    target_type: event.target_type,
    target_id: event.target_id,
    metadata: parsedMetadata,
  });

  if (error) {
    throw error;
  }
}

export function trackScoreSeen(jobId: string, score: number): Promise<void> {
  return insertSwipeEvent('score_seen', jobId, score);
}

export function trackSwipeDecision(
  jobId: string,
  score: number,
  action: 'like' | 'pass',
): Promise<void> {
  return insertSwipeEvent('swipe_decision', jobId, score, { action });
}

export function trackApplicationSubmitted(
  jobId: string,
  score: number,
  mandatorySkillsMet?: boolean,
  source?: 'job_link' | 'direct',
): Promise<void> {
  return insertSwipeEvent('application_submitted', jobId, score, {
    ...(mandatorySkillsMet === undefined ? {} : { mandatory_skills_met: mandatorySkillsMet }),
    ...(source ? { source } : {}),
  });
}