import { useEffect, useRef, useState } from 'react';
import type { CandidateProfile, Job } from '../../lib/types';
import { calculateSwipeMatch } from '../match/adapters/swipeMatchAdapter';
import type { MatchResult } from '../match/types';
import {
  trackApplicationSubmitted,
  trackScoreSeen,
  trackSwipeDecision,
} from '../telemetry/api';

const SWIPE_THRESHOLD = 120;

export interface SwipeDeckCard {
  job: Job;
  match: MatchResult;
}

export function useSwipeDeck(
  initialJobs: Job[],
  candidate: CandidateProfile,
  onApply: (job: Job) => void,
) {
  const [jobs, setJobs] = useState(initialJobs);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(
    () => new Set(),
  );
  const lastSeenCard = useRef<string | null>(null);

  const cards: SwipeDeckCard[] = jobs
    .slice(0, 3)
    .map((job) => ({ job, match: calculateSwipeMatch(job, candidate) }));
  const activeCard = cards[0] ?? null;
  const activeJobId = activeCard?.job.id;
  const activeScore = activeCard?.match.score;

  useEffect(() => {
    if (activeJobId === undefined || activeScore === undefined) {
      lastSeenCard.current = null;
      return;
    }

    const cardKey = `${activeJobId}:${activeScore}`;
    if (lastSeenCard.current === cardKey) {
      return;
    }
    lastSeenCard.current = cardKey;
    void trackScoreSeen(activeJobId, activeScore).catch(
      () => undefined,
    );
  }, [activeJobId, activeScore]);

  const swipe = (direction: 'left' | 'right'): Job | null => {
    const currentJob = jobs[0];
    if (!currentJob) {
      return null;
    }
    const match = calculateSwipeMatch(currentJob, candidate);
    const action = direction === 'right' ? 'like' : 'pass';
    void trackSwipeDecision(currentJob.id, match.score, action).catch(
      () => undefined,
    );

    if (direction === 'right') {
      setAppliedJobIds((previous) => new Set(previous).add(currentJob.id));
      const mandatorySkillsMet = match.factors.every(
        (factor) => factor.mandatory !== true || factor.declared > 0,
      );
      void trackApplicationSubmitted(
        currentJob.id,
        match.score,
        mandatorySkillsMet,
      ).catch(() => undefined);
      onApply(currentJob);
    }

    setJobs((previous) => previous.slice(1));
    return currentJob;
  };

  const handleDragEnd = (
    offsetX: number,
  ): 'left' | 'right' | null => {
    if (offsetX > SWIPE_THRESHOLD) {
      swipe('right');
      return 'right';
    }
    if (offsetX < -SWIPE_THRESHOLD) {
      swipe('left');
      return 'left';
    }
    return null;
  };

  const reset = () => {
    setJobs(initialJobs);
    setAppliedJobIds(new Set());
  };

  return {
    cards,
    currentJob: jobs[0] ?? null,
    appliedCount: appliedJobIds.size,
    passCurrent: () => swipe('left'),
    likeCurrent: () => swipe('right'),
    handleDragEnd,
    reset,
  };
}