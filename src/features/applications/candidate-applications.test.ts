import { describe, expect, it } from 'vitest';
import {
  latestFeedback,
  mapCandidateApplication,
  type CandidateApplicationRow,
} from './candidate-applications';

function makeRow(
  overrides: Partial<CandidateApplicationRow> = {},
): CandidateApplicationRow {
  return {
    id: 'app-1',
    job_id: 'job-1',
    current_stage: 'screening',
    match_score: 82,
    created_at: '2026-10-01T15:00:00Z',
    feedback_deadlines: [
      { due_at: '2026-10-07T15:00:00Z', met_at: null, postpone_no: 0 },
    ],
    jobs: { title: 'Analista de Dados', companies: { name: 'Acme' } },
    feedbacks: [],
    application_stages: [
      { new_stage: 'new_application', created_at: '2026-10-01T15:00:00Z' },
      { new_stage: 'screening', created_at: '2026-10-02T15:00:00Z' },
    ],
    ...overrides,
  };
}

describe('latestFeedback', () => {
  it('returns null when nothing was sent to the candidate', () => {
    expect(latestFeedback(null)).toBeNull();
    expect(
      latestFeedback([
        {
          content: 'rascunho',
          sent_to_candidate_at: null,
          created_at: '2026-10-02T10:00:00Z',
        },
      ]),
    ).toBeNull();
  });

  it('picks the most recent feedback that was sent', () => {
    const feedback = latestFeedback([
      {
        content: 'primeiro',
        sent_to_candidate_at: '2026-10-02T10:00:00Z',
        created_at: '2026-10-02T10:00:00Z',
      },
      {
        content: 'segundo',
        sent_to_candidate_at: '2026-10-03T10:00:00Z',
        created_at: '2026-10-03T10:00:00Z',
      },
    ]);

    expect(feedback?.content).toBe('segundo');
  });
});

describe('mapCandidateApplication', () => {
  it('maps the stage, job, company and score', () => {
    expect(mapCandidateApplication(makeRow())).toMatchObject({
      id: 'app-1',
      jobTitle: 'Analista de Dados',
      companyName: 'Acme',
      stage: 'Triagem',
      matchScore: 82,
    });
  });

  it('falls back when the job or company is not visible', () => {
    const application = mapCandidateApplication(makeRow({ jobs: null }));

    expect(application?.jobTitle).toBe('Vaga indisponível');
    expect(application?.companyName).toBeNull();
  });

  it('returns null for a stage the screen does not show', () => {
    expect(
      mapCandidateApplication(makeRow({ current_stage: 'withdrawn' })),
    ).toBeNull();
  });

  it('exposes the open return deadline and its postponements', () => {
    expect(mapCandidateApplication(makeRow())).toMatchObject({
      returnDueAt: '2026-10-07T15:00:00Z',
      postponeCount: 0,
    });

    const postponed = mapCandidateApplication(
      makeRow({
        feedback_deadlines: [
          { due_at: '2026-10-07T15:00:00Z', met_at: '2026-10-06T10:00:00Z', postpone_no: 0 },
          { due_at: '2026-10-12T15:00:00Z', met_at: null, postpone_no: 1 },
        ],
      }),
    );
    expect(postponed).toMatchObject({
      returnDueAt: '2026-10-12T15:00:00Z',
      postponeCount: 1,
    });
  });

  it('has no return deadline when none is open', () => {
    expect(mapCandidateApplication(makeRow({ feedback_deadlines: null }))).toMatchObject({
      returnDueAt: null,
      postponeCount: 0,
    });
  });

  it('builds the timeline from the stage history', () => {
    const labels = mapCandidateApplication(makeRow())?.timeline.map(
      (step) => step.label,
    );

    expect(labels).toEqual([
      'Candidatura enviada',
      'Triagem',
      'Entrevista',
      'Final',
      'Aprovado',
    ]);
  });
});
