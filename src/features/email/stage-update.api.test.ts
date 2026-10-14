import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));

import { FunctionsHttpError } from '@supabase/supabase-js';
import { sendStageUpdate } from './stage-update.api';

describe('sendStageUpdate', () => {
  beforeEach(() => {
    mocks.invoke.mockReset();
  });

  it('calls send-email with the stage_update template and only the application id', async () => {
    mocks.invoke.mockResolvedValue({ data: { status: 'sent' }, error: null });

    await expect(sendStageUpdate('app-1')).resolves.toEqual({ status: 'sent' });
    expect(mocks.invoke).toHaveBeenCalledWith('send-email', {
      body: { template: 'stage_update', application_id: 'app-1' },
    });
  });

  it('returns skipped and failed answers without throwing', async () => {
    mocks.invoke.mockResolvedValue({
      data: { status: 'skipped_duplicate', error: 'already_sent' },
      error: null,
    });
    await expect(sendStageUpdate('app-1')).resolves.toEqual({
      status: 'skipped_duplicate',
      error: 'already_sent',
    });
  });

  it('turns an HTTP error into a friendly message', async () => {
    const error = new FunctionsHttpError({ status: 403 } as Response);
    mocks.invoke.mockResolvedValue({ data: null, error });
    await expect(sendStageUpdate('app-1')).rejects.toThrow('não foi aprovada');
  });

  it('rejects an answer in an unexpected format', async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    await expect(sendStageUpdate('app-1')).rejects.toThrow('Tente de novo');
  });
});
