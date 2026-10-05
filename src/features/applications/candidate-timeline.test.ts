import { describe, expect, it } from 'vitest';
import { buildCandidateTimeline } from './candidate-timeline';

describe('buildCandidateTimeline', () => {
  it('starts with the submission and lists the rest of the funnel as pending', () => {
    const steps = buildCandidateTimeline(
      [{ new_stage: 'new_application', created_at: '2026-10-01T15:00:00Z' }],
      'Em análise',
    );

    expect(steps.map((step) => step.label)).toEqual([
      'Candidatura enviada',
      'Triagem',
      'Entrevista',
      'Final',
      'Aprovado',
    ]);
    expect(steps.map((step) => step.done)).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(steps[0]?.date).not.toBeNull();
    expect(steps[1]?.date).toBeNull();
  });

  it('orders the reached stages by date, whatever order they arrive in', () => {
    const steps = buildCandidateTimeline(
      [
        { new_stage: 'interview', created_at: '2026-10-03T15:00:00Z' },
        { new_stage: 'new_application', created_at: '2026-10-01T15:00:00Z' },
        { new_stage: 'screening', created_at: '2026-10-02T15:00:00Z' },
      ],
      'Entrevista',
    );

    expect(steps.map((step) => step.label)).toEqual([
      'Candidatura enviada',
      'Triagem',
      'Entrevista',
      'Final',
      'Aprovado',
    ]);
    expect(steps.map((step) => step.done)).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it('has no pending steps after a rejection', () => {
    const steps = buildCandidateTimeline(
      [
        { new_stage: 'new_application', created_at: '2026-10-01T15:00:00Z' },
        { new_stage: 'screening', created_at: '2026-10-02T15:00:00Z' },
        { new_stage: 'rejected', created_at: '2026-10-03T15:00:00Z' },
      ],
      'Rejeitado',
    );

    expect(steps.map((step) => step.label)).toEqual([
      'Candidatura enviada',
      'Triagem',
      'Rejeitado',
    ]);
    expect(steps.every((step) => step.done)).toBe(true);
  });

  it('still shows the submission when there is no history', () => {
    const steps = buildCandidateTimeline(null, 'Em análise');

    expect(steps[0]).toEqual({
      label: 'Candidatura enviada',
      date: null,
      done: true,
    });
    expect(steps).toHaveLength(5);
  });
});
