import { Json } from '../../shared/types/database';

export type TelemetryEventType = 'score_seen' | 'swipe_decision' | 'application_submitted';

export interface EventLog {
  id: string;
  user_id: string;
  session_id: string;
  event_type: TelemetryEventType;
  target_type: string;
  target_id: string;
  metadata: Json;
  created_at: string;
}

export interface ScoreSeenMetadata {
  job_id: string;
  score: number;
}

export interface SwipeDecisionMetadata {
  job_id: string;
  action: 'like' | 'pass';
  score: number;
}

export interface ApplicationSubmittedMetadata {
  job_id: string;
  score: number;
  mandatory_skills_met: boolean;
}
