import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));

import { FunctionsHttpError } from '@supabase/supabase-js';
import { sendBatchFeedback } from './batch-feedback.api';

const ITEMS = [
  { application_id: 'a', kind: 'decision' as const, message: 'Mensagem de teste para o candidato.' },
];

describe('sendBatchFeedback', () => {
  beforeEach(() => {
    mocks.invoke.mockReset();
  });

  it('calls send-email with the batch_feedback template and parses the answer', async () => {
    const answer = {
      sent: 1,
      failed: 0,
      skipped_duplicate: 0,
      skipped_limit: 0,
      results: [{ application_id: 'a', status: 'sent', in_app: true }],
    };
    mocks.invoke.mockResolvedValue({ data: answer, error: null });

    await expect(sendBatchFeedback(ITEMS)).resolves.toEqual(answer);
    expect(mocks.invoke).toHaveBeenCalledWith('send-email', {
      body: { template: 'batch_feedback', items: ITEMS },
    });
  });

  it('turns an HTTP error into a friendly message', async () => {
    const error = new FunctionsHttpError({ status: 403 } as Response);
    mocks.invoke.mockResolvedValue({ data: null, error });
    await expect(sendBatchFeedback(ITEMS)).rejects.toThrow('não foi aprovada');
  });

  it('rejects an answer in an unexpected format', async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    await expect(sendBatchFeedback(ITEMS)).rejects.toThrow('Tente de novo');
  });
});
