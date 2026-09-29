import { describe, expect, it } from 'vitest';
import { mockCandidate, mockJobs } from '../../../lib/mock-data';
import { calculateSwipeMatch } from './swipeMatchAdapter';

describe('calculateSwipeMatch', () => {
  it('adapts the legacy mock job and candidate into the Match Score engine', () => {
    const result = calculateSwipeMatch(mockJobs[0], mockCandidate);

    expect(result.score).toBe(95.83);
    expect(result.factors).toHaveLength(mockJobs[0].skills.length);
    expect(result.factors[0]).toMatchObject({
      skill: 'Gestão de Projetos',
      required: 4,
      declared: 4,
      gap: 0,
      mandatory: true,
    });
  });

  it('calculates the score from skills instead of the legacy stored score', () => {
    const result = calculateSwipeMatch(mockJobs[1], mockCandidate);

    expect(result.score).toBe(100);
    expect(result.score).not.toBe(mockJobs[1].matchScore);
  });
});
