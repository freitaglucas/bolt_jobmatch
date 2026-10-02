import { afterEach, describe, expect, it } from 'vitest';
import type { ApplicationStatus, PipelineCandidate } from '../../lib/types';
import {
  clearPipelineFocus,
  focusPipelineOnJob,
  peekPipelineFocus,
} from './pipeline-focus';
import {
  ALL_JOBS,
  buildPipelineColumns,
  filterCandidatesByJob,
  PIPELINE_COLUMNS,
} from './pipeline-view';

function makeCandidate(
  id: string,
  jobId: string,
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
    jobId,
  };
}

const CANDIDATES: PipelineCandidate[] = [
  makeCandidate('a', 'job-1', 'Em análise', 50),
  makeCandidate('b', 'job-1', 'Em análise', 80),
  makeCandidate('c', 'job-2', 'Triagem', 70),
  makeCandidate('d', 'job-1', 'Em análise', 50),
  makeCandidate('e', 'job-2', 'Rejeitado', 10),
];

describe('PIPELINE_COLUMNS', () => {
  it('lists the six stages in process order', () => {
    expect(PIPELINE_COLUMNS.map((column) => column.stage)).toEqual([
      'Em análise',
      'Triagem',
      'Entrevista',
      'Final',
      'Aprovado',
      'Rejeitado',
    ]);
  });
});

describe('filterCandidatesByJob', () => {
  it('returns everyone for the all-jobs option', () => {
    expect(filterCandidatesByJob(CANDIDATES, ALL_JOBS)).toEqual(CANDIDATES);
  });

  it('keeps only the candidates of the chosen job', () => {
    expect(
      filterCandidatesByJob(CANDIDATES, 'job-2').map((candidate) => candidate.id),
    ).toEqual(['c', 'e']);
  });

  it('returns nothing for an unknown job', () => {
    expect(filterCandidatesByJob(CANDIDATES, 'job-9')).toEqual([]);
  });
});

describe('buildPipelineColumns', () => {
  it('always returns the six columns, even the empty ones', () => {
    const columns = buildPipelineColumns([]);
    expect(columns).toHaveLength(6);
    expect(columns.every((column) => column.candidates.length === 0)).toBe(true);
  });

  it('groups by stage and sorts by match, keeping the order on ties', () => {
    const columns = buildPipelineColumns(CANDIDATES);
    const byStage = Object.fromEntries(
      columns.map((column) => [
        column.stage,
        column.candidates.map((candidate) => candidate.id),
      ]),
    );

    expect(byStage['Em análise']).toEqual(['b', 'a', 'd']);
    expect(byStage['Triagem']).toEqual(['c']);
    expect(byStage['Entrevista']).toEqual([]);
    expect(byStage['Rejeitado']).toEqual(['e']);
  });

  it('does not change the original list', () => {
    buildPipelineColumns(CANDIDATES);
    expect(CANDIDATES.map((candidate) => candidate.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
  });
});

describe('pipeline focus', () => {
  afterEach(() => {
    clearPipelineFocus();
  });

  it('starts empty', () => {
    expect(peekPipelineFocus()).toBeNull();
  });

  it('keeps the chosen job until it is cleared', () => {
    focusPipelineOnJob('job-1');
    expect(peekPipelineFocus()).toBe('job-1');
    expect(peekPipelineFocus()).toBe('job-1');
    clearPipelineFocus();
    expect(peekPipelineFocus()).toBeNull();
  });
});
