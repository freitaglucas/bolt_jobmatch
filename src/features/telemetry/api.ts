import { z } from 'zod';
import { supabase } from '../../shared/lib/supabase';
import {
  ApplicationSubmittedMetadataSchema,
  EventLogSchema,
  ScoreSeenMetadataSchema,
  SwipeDecisionMetadataSchema,
} from './schemas';

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

async function insertSwipeEvent(
  eventType: 'score_seen' | 'swipe_decision' | 'application_submitted',
  jobId: string,
  score: number,
  extraMetadata?: { action: 'like' | 'pass' } | { mandatory_skills_met: boolean },
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
): Promise<void> {
  return insertSwipeEvent(
    'application_submitted',
    jobId,
    score,
    mandatorySkillsMet === undefined
      ? undefined
      : { mandatory_skills_met: mandatorySkillsMet },
  );
}