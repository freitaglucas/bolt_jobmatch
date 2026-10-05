import { describe, expect, it } from 'vitest';
import type { ApplicationStatus, PipelineCandidate } from '../../lib/types';
import { buildDashboardStats, pickTopCandidates } from './dashboard-stats';

function makeCandidate(
  id: string,
  stage: ApplicationStatus,
  matchScore: number,
): PipelineCandidate {
  return {
    id,
    name: `Candidato ${id}`,
    role: 'Analista',
    seniority: 'Pleno',
    matchScore,
    appliedDate: '01/10/2026',
    stage,
    avatarColor: 'bg-primary',
  };
}

const CANDIDATES: PipelineCandidate[] = [
  makeCandidate('a', 'Em análise', 50),
  makeCandidate('b', 'Em análise', 80),
  makeCandidate('c', 'Triagem', 70),
  makeCandidate('d', 'Entrevista', 90),
  makeCandidate('e', 'Final', 60),
  makeCandidate('f', 'Aprovado', 95),
  makeCandidate('g', 'Rejeitado', 99),
];

describe('buildDashboardStats', () => {
  it('counts the applications by stage', () => {
    const stats = buildDashboardStats(CANDIDATES, []);

    expect(stats.totalApplications).toBe(7);
    expect(stats.newApplications).toBe(2);
    expect(stats.interviews).toBe(2);
    expect(stats.approved).toBe(1);
    expect(stats.rejected).toBe(1);
  });

  it('counts the jobs by status', () => {
    const stats = buildDashboardStats(
      [],
      [
        { status: 'active' },
        { status: 'active' },
        { status: 'paused' },
        { status: 'draft' },
        { status: 'closed' },
      ],
    );

    expect(stats.activeJobs).toBe(2);
    expect(stats.pausedOrDraftJobs).toBe(2);
    expect(stats.closedJobs).toBe(1);
  });

  it('returns zeros when there is nothing yet', () => {
    expect(buildDashboardStats([], [])).toEqual({
      activeJobs: 0,
      pausedOrDraftJobs: 0,
      closedJobs: 0,
      totalApplications: 0,
      newApplications: 0,
      interviews: 0,
      approved: 0,
      rejected: 0,
    });
  });
});

describe('pickTopCandidates', () => {
  it('sorts by match, skips rejected and respects the limit', () => {
    expect(
      pickTopCandidates(CANDIDATES, 3).map((candidate) => candidate.id),
    ).toEqual(['f', 'd', 'b']);
  });

  it('keeps the received order on ties', () => {
    const tied = [
      makeCandidate('x', 'Triagem', 70),
      makeCandidate('y', 'Triagem', 70),
      makeCandidate('z', 'Triagem', 70),
    ];

    expect(pickTopCandidates(tied).map((candidate) => candidate.id)).toEqual([
      'x',
      'y',
      'z',
    ]);
  });

  it('does not change the original list', () => {
    pickTopCandidates(CANDIDATES);
    expect(CANDIDATES.map((candidate) => candidate.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
    ]);
  });
});
