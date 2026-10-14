import { describe, expect, it, vi } from 'vitest';
import type { PipelineCandidate } from '../../lib/types';
import type { BatchResponse } from '../email/batch-feedback.schemas';
import {
  buildCloseJobPlan,
  closeJobErrorMessage,
  isPendingCandidatesError,
  pendingCandidates,
  runCloseJob,
} from './close-job';

const NOW = new Date(2026, 9, 14, 10, 0, 0);

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
    ...overrides,
  };
}

function response(results: BatchResponse['results']): BatchResponse {
  return { sent: 0, failed: 0, skipped_duplicate: 0, skipped_limit: 0, results };
}

describe('pendingCandidates', () => {
  it('keeps only candidates still waiting for an answer', () => {
    const list = [
      candidate({ id: 'a', stage: 'Em análise' }),
      candidate({ id: 'b', stage: 'Final' }),
      candidate({ id: 'c', stage: 'Aprovado' }),
      candidate({ id: 'd', stage: 'Rejeitado' }),
    ];
    expect(pendingCandidates(list).map((c) => c.id)).toEqual(['a', 'b']);
  });
});

describe('buildCloseJobPlan', () => {
  it('gives each pending candidate the closed-job reason and the Rejeitado target', () => {
    const plan = buildCloseJobPlan(
      [candidate({ id: 'a' }), candidate({ id: 'b', name: 'João Lima' })],
      NOW,
    );
    expect(plan.excluded).toEqual([]);
    expect(plan.entries.map((e) => [e.candidate.id, e.reasonCode, e.targetStage])).toEqual([
      ['a', 'job_closed', 'Rejeitado'],
      ['b', 'job_closed', 'Rejeitado'],
    ]);
    const message = plan.entries[1]?.message ?? '';
    expect(message).toContain('Olá, João!');
    expect(message).toContain('A vaga Analista de Dados foi encerrada');
    expect(message).not.toContain('pontos fortes');
  });
});

describe('error messages', () => {
  it('recognizes the database rule and explains it', () => {
    const error = { message: 'job_has_pending_candidates', code: 'P0001' };
    expect(isPendingCandidatesError(error)).toBe(true);
    expect(closeJobErrorMessage(error)).toContain('aguardando retorno');
    expect(isPendingCandidatesError(new Error('outra coisa'))).toBe(false);
    expect(isPendingCandidatesError(null)).toBe(false);
    expect(closeJobErrorMessage(new Error('x'))).toContain('não foi possível encerrar');
  });
});

describe('runCloseJob', () => {
  const entries = () =>
    buildCloseJobPlan([candidate({ id: 'a' }), candidate({ id: 'b' })], NOW).entries;

  it('closes a job with no pending candidates without sending anything', async () => {
    const send = vi.fn();
    const move = vi.fn();
    const close = vi.fn().mockResolvedValue(undefined);

    const result = await runCloseJob({ send, move, close }, []);

    expect(result).toEqual({ outcomes: [], closed: true, message: null });
    expect(send).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('sends the final return, moves everyone to Rejeitado and then closes the job', async () => {
    const send = vi.fn().mockResolvedValue(
      response([
        { application_id: 'a', status: 'sent' },
        { application_id: 'b', status: 'sent' },
      ]),
    );
    const move = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);

    const result = await runCloseJob({ send, move, close }, entries());

    expect(send.mock.calls[0]?.[0].map((i: { reason_code?: string }) => i.reason_code)).toEqual([
      'job_closed',
      'job_closed',
    ]);
    expect(move.mock.calls).toEqual([
      ['a', 'Rejeitado'],
      ['b', 'Rejeitado'],
    ]);
    expect(close).toHaveBeenCalledTimes(1);
    expect(result.closed).toBe(true);
    expect(result.message).toBeNull();
  });

  it('counts a candidate whose only the e-mail failed as answered (the return is in the app)', async () => {
    const send = vi.fn().mockResolvedValue(
      response([
        { application_id: 'a', status: 'failed', error: 'email_failed', in_app: true },
        { application_id: 'b', status: 'sent' },
      ]),
    );
    const move = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);

    const result = await runCloseJob({ send, move, close }, entries());

    expect(result.closed).toBe(true);
    expect(result.outcomes[0]?.status).toBe('email_failed');
  });

  it('keeps the job open when somebody did not get the return', async () => {
    const send = vi.fn().mockResolvedValue(
      response([
        { application_id: 'a', status: 'sent' },
        { application_id: 'b', status: 'skipped_duplicate', error: 'already_sent' },
      ]),
    );
    const move = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn();

    const result = await runCloseJob({ send, move, close }, entries());

    expect(close).not.toHaveBeenCalled();
    expect(result.closed).toBe(false);
    expect(result.message).toContain('A vaga continua aberta');
    expect(result.outcomes.map((o) => o.moved)).toEqual([true, false]);
  });

  it('keeps the job open when a stage change fails', async () => {
    const send = vi.fn().mockResolvedValue(
      response([
        { application_id: 'a', status: 'sent' },
        { application_id: 'b', status: 'sent' },
      ]),
    );
    const move = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('rls'));
    const close = vi.fn();

    const result = await runCloseJob({ send, move, close }, entries());

    expect(close).not.toHaveBeenCalled();
    expect(result.closed).toBe(false);
  });

  it('reports the database refusal when the close itself fails', async () => {
    const send = vi.fn().mockResolvedValue(
      response([
        { application_id: 'a', status: 'sent' },
        { application_id: 'b', status: 'sent' },
      ]),
    );
    const move = vi.fn().mockResolvedValue(undefined);
    const close = vi
      .fn()
      .mockRejectedValue({ message: 'job_has_pending_candidates', code: 'P0001' });

    const result = await runCloseJob({ send, move, close }, entries());

    expect(result.closed).toBe(false);
    expect(result.message).toContain('aguardando retorno');
  });
});
