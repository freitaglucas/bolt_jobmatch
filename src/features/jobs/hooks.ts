import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Job } from '../../lib/types';
import type { CandidateSkill } from '../match/types';
import { calculateSwipeMatch } from '../match/adapters/swipeMatchAdapter';
import type { MatchResult } from '../match/types';
import { getActiveJobs } from './api';
import {
  trackScoreSeen,
  trackSwipeDecision,
} from '../telemetry/api';

const SWIPE_THRESHOLD = 120;

export function useActiveJobs() {
  return useQuery({
    queryKey: ['jobs', 'active'],
    queryFn: getActiveJobs,
    staleTime: 60_000,
  });
}

export interface SwipeDeckCard {
  job: Job;
  match: MatchResult;
}

export function useSwipeDeck(
  initialJobs: Job[],
  candidateSkills: CandidateSkill[],
  onApply: (job: Job) => Promise<boolean>,
) {
  const [jobs, setJobs] = useState(initialJobs);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(
    () => new Set(),
  );
  const isApplyingRef = useRef(false);
  const lastSeenCard = useRef<string | null>(null);

  useEffect(() => {
    setJobs(initialJobs);
    setAppliedJobIds(new Set());
    lastSeenCard.current = null;
  }, [initialJobs]);

  const cards: SwipeDeckCard[] = jobs
    .slice(0, 3)
    .map((job) => ({ job, match: calculateSwipeMatch(job, candidateSkills) }));
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

  const swipe = async (
    direction: 'left' | 'right',
  ): Promise<Job | null> => {
    if (isApplyingRef.current) {
      return null;
    }
    const currentJob = jobs[0];
    if (!currentJob) {
      return null;
    }
    const match = calculateSwipeMatch(currentJob, candidateSkills);
    const action = direction === 'right' ? 'like' : 'pass';
    void trackSwipeDecision(currentJob.id, match.score, action).catch(
      () => undefined,
    );

    if (direction === 'right') {
      isApplyingRef.current = true;
      setIsApplying(true);
      let applicationAccepted: boolean;
      try {
        applicationAccepted = await onApply(currentJob);
      } finally {
        isApplyingRef.current = false;
        setIsApplying(false);
      }
      if (!applicationAccepted) {
        return null;
      }
      setAppliedJobIds((previous) => new Set(previous).add(currentJob.id));
    }

    setJobs((previous) => previous.slice(1));
    return currentJob;
  };

  const handleDragEnd = (
    offsetX: number,
  ): 'left' | 'right' | null => {
    if (isApplyingRef.current) {
      return null;
    }
    if (offsetX > SWIPE_THRESHOLD) {
      void swipe('right');
      return 'right';
    }
    if (offsetX < -SWIPE_THRESHOLD) {
      void swipe('left');
      return 'left';
    }
    return null;
  };

  const reset = () => {
    setJobs(initialJobs);
    setAppliedJobIds(new Set());
    lastSeenCard.current = null;
  };

  return {
    cards,
    currentJob: jobs[0] ?? null,
    appliedCount: appliedJobIds.size,
    isApplying,
    passCurrent: () => swipe('left'),
    likeCurrent: () => swipe('right'),
    handleDragEnd,
    reset,
  };
}