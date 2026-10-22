import { describe, expect, it, vi } from 'vitest';
import type { PipelineCandidate } from '../../lib/types';
import type { BatchResponse } from '../email/batch-feedback.schemas';
import {
  BATCH_CHUNK_SIZE,
  DEFAULT_CLOSING,
  DEFAULT_OPENING,
  applyName,
  buildBatchMessage,
  buildBatchPlan,
  checkEligibility,
  chunk,
  defaultDueDate,
  dueDateBounds,
  dueDateToIso,
  firstName,
  runBatchFeedback,
  summarizeOutcomes,
  toRequestItem,
  validateComposerTexts,
  validateDueDate,
  type BatchEntry,
} from './batch-feedback';

// 13/10/2026, 10h, fuso local.
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

describe('due date helpers', () => {
  it('accepts from tomorrow up to 13 days ahead', () => {
    expect(dueDateBounds(NOW)).toEqual({ min: '2026-10-14', max: '2026-10-26' });
    expect(defaultDueDate(NOW)).toBe('2026-10-20');
    expect(validateDueDate('2026-10-14', NOW)).toBeNull();
    expect(validateDueDate('2026-10-26', NOW)).toBeNull();
  });

  it('rejects today, past, too far and invalid dates', () => {
    expect(validateDueDate('2026-10-13', NOW)).toContain('a partir de amanhã');
    expect(validateDueDate('2026-10-27', NOW)).toContain('13 dias');
    expect(validateDueDate('', NOW)).toContain('Escolha');
    expect(validateDueDate('2026-02-31', NOW)).toContain('Escolha');
  });

  it('turns the date into 18h local time', () => {
    expect(dueDateToIso('2026-10-20')).toBe(new Date(2026, 9, 20, 18, 0, 0).toISOString());
    expect(dueDateToIso('xyz')).toBeNull();
  });

  it('keeps the new date inside the 14-day database limit', () => {
    const lateNight = new Date(2026, 9, 13, 0, 30, 0);
    const iso = dueDateToIso(dueDateBounds(lateNight).max);
    expect(new Date(iso ?? '').getTime() - lateNight.getTime()).toBeLessThan(14 * 86_400_000);
  });
});

describe('validateComposerTexts', () => {
  it('limits opening and closing to 300 characters', () => {
    expect(validateComposerTexts(DEFAULT_OPENING, DEFAULT_CLOSING)).toBeNull();
    expect(validateComposerTexts('x'.repeat(301), 'ok')).toContain('300');
    expect(validateComposerTexts('ok', 'x'.repeat(301))).toContain('300');
  });
});

describe('checkEligibility', () => {
  const options = { dueDate: '2026-10-20', now: NOW };

  it('lets an active candidate receive an update', () => {
    expect(checkEligibility(candidate(), 'update', options)).toBeNull();
  });

  it('blocks final stages and the 3rd postponement for updates', () => {
    expect(checkEligibility(candidate({ stage: 'Rejeitado' }), 'update', options)).toContain(
      'sem prazo',
    );
    expect(checkEligibility(candidate({ postponeCount: 2 }), 'update', options)).toContain(
      '2 adiamentos',
    );
  });

  it('requires a date after the current deadline', () => {
    const reason = checkEligibility(
      candidate({ returnDueAt: new Date(2026, 9, 22, 12, 0, 0).toISOString() }),
      'update',
      options,
    );
    expect(reason).toContain('depois do prazo atual (22/10/2026)');
  });

  it('advances only up to Interview; approval stays individual', () => {
    expect(checkEligibility(candidate({ stage: 'Em análise' }), 'advance', options)).toBeNull();
    expect(checkEligibility(candidate({ stage: 'Entrevista' }), 'advance', options)).toBeNull();
    expect(checkEligibility(candidate({ stage: 'Final' }), 'advance', options)).toContain(
      'individualmente',
    );
    expect(checkEligibility(candidate({ stage: 'Aprovado' }), 'advance', options)).not.toBeNull();
  });
});

describe('names', () => {
  it('uses the first name and drops the placeholder when there is none', () => {
    expect(firstName('  Maria  Souza ')).toBe('Maria');
    expect(firstName('Candidato(a)')).toBe('');
    expect(applyName('Olá, {nome}!', 'Maria')).toBe('Olá, Maria!');
    expect(applyName('Olá, {nome}!', '')).toBe('Olá!');
  });
});

describe('buildBatchMessage', () => {
  const base = {
    candidate: candidate(),
    opening: DEFAULT_OPENING,
    closing: DEFAULT_CLOSING,
    dueDate: '2026-10-20',
    now: NOW,
  };

  it('builds the honest update with the stage, the job and the new date', () => {
    const message = buildBatchMessage({ ...base, type: 'update' });
    expect(message).toContain('Olá, Maria!');
    expect(message).toContain('vaga Analista de Dados, na etapa Triagem');
    expect(message).toContain('próximo retorno será até 20/10/2026');
    expect(message).toContain(DEFAULT_CLOSING);
  });

  it('builds the advance message with the next stage and the 5-day return', () => {
    const message = buildBatchMessage({ ...base, type: 'advance' });
    expect(message).toContain('avançou para a etapa Entrevista da vaga Analista de Dados');
    expect(message).toContain('até 18/10/2026');
  });

  it('never carries a score', () => {
    const message = buildBatchMessage({ ...base, type: 'update' });
    expect(message).not.toMatch(/\d+\s?%|score|match/i);
  });

  it('stays below the e-mail function limits with the longest texts', () => {
    const long = 'x'.repeat(300);
    const message = buildBatchMessage({
      ...base,
      type: 'update',
      opening: long,
      closing: long,
      candidate: candidate({ jobTitle: 'y'.repeat(120) }),
    });
    expect(message.length).toBeLessThanOrEqual(1000);
  });

  it('skips empty opening and closing', () => {
    const message = buildBatchMessage({ ...base, type: 'advance', opening: '', closing: '' });
    expect(message.startsWith('Você avançou')).toBe(true);
    expect(message.endsWith('.')).toBe(true);
  });
});

describe('buildBatchPlan', () => {
  const input = {
    type: 'update' as const,
    opening: DEFAULT_OPENING,
    closing: DEFAULT_CLOSING,
    dueDate: '2026-10-20',
    now: NOW,
  };

  it('separates who goes in from who stays out, with the reason', () => {
    const ok = candidate({ id: 'a' });
    const blocked = candidate({ id: 'b', postponeCount: 2 });
    const plan = buildBatchPlan({ ...input, candidates: [ok, blocked] });
    expect(plan.entries.map((entry) => entry.candidate.id)).toEqual(['a']);
    expect(plan.excluded).toEqual([
      { candidate: blocked, reason: expect.stringContaining('2 adiamentos') },
    ]);
  });

  it('sets the new date for updates and the target stage for advances', () => {
    const update = buildBatchPlan({ ...input, candidates: [candidate()] }).entries[0];
    expect(update?.newDueAt).toBe(dueDateToIso('2026-10-20'));
    expect(update?.targetStage).toBeNull();

    const advance = buildBatchPlan({ ...input, type: 'advance', candidates: [candidate()] })
      .entries[0];
    expect(advance?.newDueAt).toBeNull();
    expect(advance?.targetStage).toBe('Entrevista');
  });
});

describe('toRequestItem', () => {
  it('maps an update and a decision to the edge function format', () => {
    const update: BatchEntry = {
      candidate: candidate(),
      message: 'm'.repeat(20),
      newDueAt: '2026-10-20T21:00:00.000Z',
      targetStage: null,
    };
    expect(toRequestItem(update)).toEqual({
      application_id: 'app-1',
      kind: 'update',
      message: 'm'.repeat(20),
      new_due_at: '2026-10-20T21:00:00.000Z',
    });
    expect(toRequestItem({ ...update, newDueAt: null, targetStage: 'Entrevista' })).toEqual({
      application_id: 'app-1',
      kind: 'decision',
      message: 'm'.repeat(20),
    });
  });
});

describe('chunk', () => {
  it('splits in blocks of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });
});

function entry(id: string, targetStage: BatchEntry['targetStage'] = null): BatchEntry {
  return {
    candidate: candidate({ id, name: `Pessoa ${id}` }),
    message: 'Mensagem de teste para o candidato.',
    newDueAt: targetStage ? null : '2026-10-20T21:00:00.000Z',
    targetStage,
  };
}

function response(results: BatchResponse['results']): BatchResponse {
  const count = (status: string) => results.filter((r) => r.status === status).length;
  return {
    sent: count('sent'),
    failed: count('failed'),
    skipped_duplicate: count('skipped_duplicate'),
    skipped_limit: count('skipped_limit'),
    results,
  };
}

describe('runBatchFeedback', () => {
  it('sends an update batch without moving anyone', async () => {
    const send = vi.fn(async () => response([{ application_id: 'a', status: 'sent', in_app: true }]));
    const move = vi.fn(async () => {});
    const outcomes = await runBatchFeedback({ send, move }, [entry('a')]);
    expect(outcomes).toEqual([
      { applicationId: 'a', name: 'Pessoa a', status: 'sent', detail: null, moved: null },
    ]);
    expect(move).not.toHaveBeenCalled();
  });

  it('moves to the next stage whoever got the return registered', async () => {
    const send = vi.fn(async () =>
      response([
        { application_id: 'a', status: 'sent', in_app: true },
        { application_id: 'b', status: 'failed', error: 'email_failed', in_app: true },
        { application_id: 'c', status: 'skipped_duplicate', error: 'already_sent' },
        { application_id: 'd', status: 'failed', error: 'no_recipient' },
      ]),
    );
    const move = vi.fn(async () => {});
    const outcomes = await runBatchFeedback(
      { send, move },
      [entry('a', 'Entrevista'), entry('b', 'Entrevista'), entry('c', 'Entrevista'), entry('d', 'Entrevista')],
    );
    expect(move.mock.calls).toEqual([
      ['a', 'Entrevista'],
      ['b', 'Entrevista'],
    ]);
    expect(outcomes.map((o) => [o.status, o.moved])).toEqual([
      ['sent', true],
      ['email_failed', true],
      ['skipped', false],
      ['failed', false],
    ]);
    expect(outcomes[2]?.detail).toContain('já recebeu');
    expect(outcomes[3]?.detail).toContain('e-mail válido');
  });

  it('reports a failed stage change without hiding the sent return', async () => {
    const send = vi.fn(async () => response([{ application_id: 'a', status: 'sent', in_app: true }]));
    const move = vi.fn(async () => {
      throw new Error('rls');
    });
    const [outcome] = await runBatchFeedback({ send, move }, [entry('a', 'Entrevista')]);
    expect(outcome).toMatchObject({ status: 'sent', moved: false });
    expect(outcome?.detail).toContain('A etapa não foi alterada');
  });

  it('marks the hourly limit and a missing answer', async () => {
    const send = vi.fn(async () => response([{ application_id: 'a', status: 'skipped_limit' }]));
    const outcomes = await runBatchFeedback({ send, move: vi.fn() }, [entry('a'), entry('b')]);
    expect(outcomes[0]).toMatchObject({ status: 'skipped' });
    expect(outcomes[0]?.detail).toContain('Limite');
    expect(outcomes[1]).toMatchObject({ status: 'failed' });
  });

  it('splits into blocks of 25 and reports progress', async () => {
    const entries = Array.from({ length: BATCH_CHUNK_SIZE + 5 }, (_, i) => entry(`id-${i}`));
    const send = vi.fn(async (items: { application_id: string }[]) =>
      response(items.map((item) => ({ application_id: item.application_id, status: 'sent' as const, in_app: true }))),
    );
    const progress = vi.fn();
    const outcomes = await runBatchFeedback({ send, move: vi.fn() }, entries, progress);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0]).toHaveLength(25);
    expect(send.mock.calls[1]?.[0]).toHaveLength(5);
    expect(outcomes).toHaveLength(30);
    expect(progress.mock.calls).toEqual([[25, 30], [30, 30]]);
  });

  it('stops at the first block that fails and marks the rest as not sent', async () => {
    const entries = Array.from({ length: BATCH_CHUNK_SIZE + 2 }, (_, i) => entry(`id-${i}`));
    const send = vi.fn(async () => {
      throw new Error('Sua sessão expirou.');
    });
    const outcomes = await runBatchFeedback({ send, move: vi.fn() }, entries);
    expect(send).toHaveBeenCalledTimes(1);
    expect(outcomes).toHaveLength(27);
    expect(outcomes.every((o) => o.status === 'failed' && o.detail === 'Sua sessão expirou.')).toBe(true);
  });
});

describe('summarizeOutcomes', () => {
  it('counts each kind', () => {
    expect(
      summarizeOutcomes([
        { applicationId: 'a', name: 'A', status: 'sent', detail: null, moved: true },
        { applicationId: 'b', name: 'B', status: 'email_failed', detail: 'x', moved: false },
        { applicationId: 'c', name: 'C', status: 'skipped', detail: 'x', moved: null },
        { applicationId: 'd', name: 'D', status: 'failed', detail: 'x', moved: null },
      ]),
    ).toEqual({ sent: 1, emailFailed: 1, skipped: 1, failed: 1, moved: 1 });
  });
});

describe('manter em reserva (N83)', () => {
  const finalist = candidate({ stage: 'Final' });
  const reserved = candidate({
    stage: 'Final',
    reserveUntil: new Date(2026, 9, 27, 12).toISOString(),
    reserveRenewals: 0,
  });

  it('only accepts candidates in the Final stage, with one renewal', () => {
    const options = { dueDate: '2026-10-20', now: NOW };
    expect(checkEligibility(finalist, 'reserve', options)).toBeNull();
    expect(checkEligibility(reserved, 'reserve', options)).toBeNull();
    expect(checkEligibility(candidate({ stage: 'Entrevista' }), 'reserve', options)).toBe(
      'Só quem está na etapa Final pode ficar em reserva.',
    );
    expect(checkEligibility({ ...reserved, reserveRenewals: 1 }, 'reserve', options)).toBe(
      'A reserva já foi renovada uma vez. Dê o retorno final.',
    );
  });

  it('sends reserved candidates to "Manter em reserva" instead of a plain update', () => {
    expect(checkEligibility(reserved, 'update', { dueDate: '2026-10-20', now: NOW })).toBe(
      'Está em reserva: use "Manter em reserva" para renovar.',
    );
  });

  it('tells the candidate about the final phase, never about the reserve', () => {
    const plan = buildBatchPlan({
      type: 'reserve',
      candidates: [finalist, { ...reserved, id: 'app-2' }],
      opening: DEFAULT_OPENING,
      closing: DEFAULT_CLOSING,
      dueDate: '2026-10-20',
      now: NOW,
    });
    expect(plan.entries).toHaveLength(2);
    expect(plan.entries[0]?.message).toContain(
      'Você está na fase final do processo seletivo da vaga Analista de Dados. O próximo retorno sai até 27/10.',
    );
    expect(plan.entries[1]?.message).toContain('Você segue na fase final do processo seletivo');
    for (const entry of plan.entries) {
      expect(entry.message).not.toMatch(/reserva/i);
      expect(entry.targetStage).toBeNull();
      expect(toRequestItem(entry)).toEqual({
        application_id: entry.candidate.id,
        kind: 'reserve',
        message: entry.message,
      });
    }
  });
});

