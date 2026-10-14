import { describe, expect, it, vi } from 'vitest';
import type { PipelineCandidate } from '../../lib/types';
import type { BatchResponse } from '../email/batch-feedback.schemas';
import {
  DEFAULT_CLOSING,
  DEFAULT_OPENING,
  buildBatchPlan,
  checkEligibility,
  pickPreview,
  runBatchFeedback,
  toRequestItem,
  type BatchEntry,
} from './batch-feedback';
import type { MatchInsights, ReasonCode } from './rejection-reasons';

const NOW = new Date(2026, 9, 13, 10, 0, 0);

function candidate(overrides: Partial<PipelineCandidate> = {}): PipelineCandidate {
  return {
    id: 'app-1',
    name: 'Maria Souza',
    role: 'Analista',
    seniority: 'Pleno',
    matchScore: 80,
    appliedDate: '01/10/2026',
    stage: 'Triagem',
    avatarColor: 'bg-primary',
    jobId: 'job-1',
    jobTitle: 'Analista de Dados',
    returnDueAt: new Date(2026, 9, 15, 12, 0, 0).toISOString(),
    postponeCount: 0,
    ...overrides,
  };
}

const INSIGHTS: MatchInsights = {
  missing: ['SQL'],
  below: [],
  strengths: ['Storytelling'],
};

function planFor(
  candidates: PipelineCandidate[],
  reasons: Record<string, ReasonCode>,
  includeStrengths = true,
) {
  return buildBatchPlan({
    type: 'reject',
    candidates,
    opening: DEFAULT_OPENING,
    closing: DEFAULT_CLOSING,
    dueDate: '',
    now: NOW,
    rejection: {
      reasons,
      insights: Object.fromEntries(candidates.map((c) => [c.id, INSIGHTS])),
      includeStrengths,
    },
  });
}

describe('checkEligibility (reject)', () => {
  const options = { dueDate: '', now: NOW };

  it('accepts every active stage, including Final', () => {
    for (const stage of ['Em análise', 'Triagem', 'Entrevista', 'Final'] as const) {
      expect(checkEligibility(candidate({ stage }), 'reject', options)).toBeNull();
    }
  });

  it('blocks candidates that are already closed', () => {
    expect(checkEligibility(candidate({ stage: 'Aprovado' }), 'reject', options)).toContain(
      'encerrada',
    );
    expect(checkEligibility(candidate({ stage: 'Rejeitado' }), 'reject', options)).toContain(
      'encerrada',
    );
  });

  it('does not depend on postponements or the return date', () => {
    expect(checkEligibility(candidate({ postponeCount: 2 }), 'reject', options)).toBeNull();
  });
});

describe('buildBatchPlan (reject)', () => {
  it('builds one message per candidate with the chosen reason and the Rejeitado target', () => {
    const plan = planFor(
      [candidate({ id: 'a' }), candidate({ id: 'b', name: 'João Lima' })],
      { a: 'missing_required', b: 'better_fit' },
    );
    expect(plan.excluded).toEqual([]);
    expect(plan.entries.map((e) => [e.candidate.id, e.reasonCode, e.targetStage, e.newDueAt])).toEqual([
      ['a', 'missing_required', 'Rejeitado', null],
      ['b', 'better_fit', 'Rejeitado', null],
    ]);
    expect(plan.entries[0]?.message).toContain('Olá, Maria!');
    expect(plan.entries[0]?.message).toContain('não encontramos SQL');
    expect(plan.entries[0]?.message).toContain('Storytelling');
    expect(plan.entries[1]?.message).toContain('Olá, João!');
    expect(plan.entries[1]?.message).toContain('O seu perfil é bom');
  });

  it('leaves out closed candidates and those without a reason', () => {
    const plan = planFor(
      [candidate({ id: 'a' }), candidate({ id: 'b', stage: 'Rejeitado' }), candidate({ id: 'c' })],
      { a: 'better_fit', b: 'better_fit' },
    );
    expect(plan.entries.map((e) => e.candidate.id)).toEqual(['a']);
    expect(plan.excluded.map((e) => [e.candidate.id, e.reason])).toEqual([
      ['b', 'A candidatura já foi encerrada.'],
      ['c', 'Escolha o motivo do retorno.'],
    ]);
  });

  it('drops the strengths when the option is off, and never carries a number', () => {
    const plan = planFor([candidate()], { 'app-1': 'level_below' }, false);
    const message = plan.entries[0]?.message ?? '';
    expect(message).not.toContain('pontos fortes');
    expect(message).not.toMatch(/\d/);
  });

  it('stays below the 1500-character limit of the edge function', () => {
    const long = 'x'.repeat(300);
    const plan = buildBatchPlan({
      type: 'reject',
      candidates: [candidate({ jobTitle: 'Analista de Dados Sênior de Operações' })],
      opening: long,
      closing: long,
      dueDate: '',
      now: NOW,
      rejection: {
        reasons: { 'app-1': 'level_below' },
        insights: {
          'app-1': {
            missing: [],
            below: [
              { skill: 'Gestão de Projetos', required: 4, declared: 2 },
              { skill: 'Análise de Dados', required: 5, declared: 3 },
            ],
            strengths: ['Comunicação', 'Liderança', 'Negociação'],
          },
        },
        includeStrengths: true,
      },
    });
    expect((plan.entries[0]?.message ?? '').length).toBeLessThan(1500);
  });
});

describe('toRequestItem (reject)', () => {
  it('sends a decision with the reason code', () => {
    const [entry] = planFor([candidate()], { 'app-1': 'eliminatory' }).entries;
    expect(entry && toRequestItem(entry)).toEqual({
      application_id: 'app-1',
      kind: 'decision',
      message: entry?.message,
      reason_code: 'eliminatory',
    });
  });
});

describe('pickPreview', () => {
  function entry(id: string, reasonCode: ReasonCode | null): BatchEntry {
    return { candidate: candidate({ id }), message: id, newDueAt: null, targetStage: null, reasonCode };
  }

  it('shows one message of each reason first, then fills with the rest', () => {
    const entries = [
      entry('a', 'better_fit'),
      entry('b', 'better_fit'),
      entry('c', 'missing_required'),
      entry('d', 'level_below'),
      entry('e', 'better_fit'),
    ];
    expect(pickPreview(entries, 3).map((e) => e.candidate.id)).toEqual(['a', 'c', 'd']);
    expect(pickPreview(entries, 4).map((e) => e.candidate.id)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('is just the first ones when there is no reason (update and advance)', () => {
    const entries = [entry('a', null), entry('b', null), entry('c', null), entry('d', null)];
    expect(pickPreview(entries, 3).map((e) => e.candidate.id)).toEqual(['a', 'b', 'c']);
    expect(pickPreview([], 3)).toEqual([]);
  });
});

describe('runBatchFeedback (reject)', () => {
  it('sends the reason and moves to Rejeitado whoever had the return registered', async () => {
    const entries = planFor(
      [candidate({ id: 'a' }), candidate({ id: 'b' })],
      { a: 'better_fit', b: 'missing_required' },
    ).entries;
    const response: BatchResponse = {
      sent: 1,
      failed: 1,
      skipped_duplicate: 0,
      skipped_limit: 0,
      results: [
        { application_id: 'a', status: 'sent' },
        { application_id: 'b', status: 'failed', error: 'invalid_item' },
      ],
    };
    const send = vi.fn().mockResolvedValue(response);
    const move = vi.fn().mockResolvedValue(undefined);

    const outcomes = await runBatchFeedback({ send, move }, entries);

    expect(send.mock.calls[0]?.[0].map((item: { reason_code?: string }) => item.reason_code)).toEqual([
      'better_fit',
      'missing_required',
    ]);
    expect(move).toHaveBeenCalledTimes(1);
    expect(move).toHaveBeenCalledWith('a', 'Rejeitado');
    expect(outcomes.map((o) => [o.applicationId, o.status, o.moved])).toEqual([
      ['a', 'sent', true],
      ['b', 'failed', false],
    ]);
  });
});
