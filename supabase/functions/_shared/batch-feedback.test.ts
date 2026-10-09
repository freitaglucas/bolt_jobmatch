import { describe, expect, it, vi } from 'vitest';
import {
  MAX_BATCH_ITEMS,
  buildFromHeader,
  parseBatchItems,
  processBatch,
  renderBatchFeedbackEmail,
  type ApplicationInfo,
  type BatchDeps,
  type BatchItem,
} from './batch-feedback.ts';

const APP_1 = '11111111-1111-4111-8111-111111111111';
const APP_2 = '22222222-2222-4222-8222-222222222222';
const MESSAGE = 'Olá! Seguimos com outros perfis nesta etapa.';

function decision(overrides: Record<string, unknown> = {}) {
  return { application_id: APP_1, kind: 'decision', message: MESSAGE, ...overrides };
}

function update(overrides: Record<string, unknown> = {}) {
  return {
    application_id: APP_1,
    kind: 'update',
    message: 'Seguimos analisando seu perfil.',
    new_due_at: '2026-10-20T12:00:00Z',
    ...overrides,
  };
}

describe('parseBatchItems', () => {
  it('accepts a decision with a reason and an update with a new date', () => {
    const result = parseBatchItems([
      decision({ reason_code: 'better_fit' }),
      update({ application_id: APP_2 }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rejected).toEqual([]);
    expect(result.items).toEqual([
      { applicationId: APP_1, kind: 'decision', reasonCode: 'better_fit', message: MESSAGE, newDueAt: null },
      {
        applicationId: APP_2,
        kind: 'update',
        reasonCode: null,
        message: 'Seguimos analisando seu perfil.',
        newDueAt: '2026-10-20T12:00:00.000Z',
      },
    ]);
  });

  it('rejects an empty body, a non-list and more than 25 items', () => {
    expect(parseBatchItems(undefined)).toEqual({ ok: false, error: 'invalid_items' });
    expect(parseBatchItems([])).toEqual({ ok: false, error: 'invalid_items' });
    expect(parseBatchItems({})).toEqual({ ok: false, error: 'invalid_items' });
    const many = Array.from({ length: MAX_BATCH_ITEMS + 1 }, () => decision());
    expect(parseBatchItems(many)).toEqual({ ok: false, error: 'too_many_items' });
  });

  it('keeps going when one item is bad', () => {
    const result = parseBatchItems([decision({ kind: 'other' }), decision({ application_id: APP_2 })]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(1);
    expect(result.rejected).toEqual([
      { application_id: APP_1, status: 'failed', error: 'invalid_item' },
    ]);
  });

  it('validates id, message size, reason and due date', () => {
    const bad = [
      decision({ application_id: 'not-a-uuid' }),
      decision({ message: 'curto' }),
      decision({ message: 'x'.repeat(1501) }),
      decision({ reason_code: 'free_text' }),
      decision({ new_due_at: '2026-10-20T12:00:00Z' }),
      update({ message: 'x'.repeat(1001) }),
      update({ new_due_at: undefined }),
      update({ new_due_at: 'xyz' }),
      update({ reason_code: 'better_fit' }),
      null,
    ];
    const result = parseBatchItems(bad);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toEqual([]);
    expect(result.rejected).toHaveLength(bad.length);
  });

  it('accepts a decision message up to 1500 characters', () => {
    const result = parseBatchItems([decision({ message: 'x'.repeat(1500) })]);
    expect(result.ok && result.items).toHaveLength(1);
  });

  it('skips the same application twice in one batch', () => {
    const result = parseBatchItems([decision(), decision()]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(1);
    expect(result.rejected).toEqual([
      { application_id: APP_1, status: 'skipped_duplicate', error: 'duplicate_in_batch' },
    ]);
  });
});

describe('buildFromHeader', () => {
  it('uses "<Company> via Job Match" with the configured address', () => {
    expect(buildFromHeader('Job Match <avisos@mail.jobmatchrh.com>', 'Acme Ltda')).toBe(
      '"Acme Ltda via Job Match" <avisos@mail.jobmatchrh.com>',
    );
  });

  it('cleans characters that could break the header', () => {
    expect(buildFromHeader('Job Match <a@b.co>', 'Ac"me <x@y.z>,\nLtda')).toBe(
      '"Acme xy.z Ltda via Job Match" <a@b.co>',
    );
  });

  it('falls back to "Job Match" without a company and keeps a bare address', () => {
    expect(buildFromHeader('avisos@mail.jobmatchrh.com', null)).toBe(
      '"Job Match" <avisos@mail.jobmatchrh.com>',
    );
  });

  it('returns the configured value when it has no valid address', () => {
    expect(buildFromHeader('Job Match', 'Acme')).toBe('Job Match');
  });
});

describe('renderBatchFeedbackEmail', () => {
  it('escapes the message, keeps paragraphs and adds the footer', () => {
    const email = renderBatchFeedbackEmail({
      kind: 'decision',
      companyName: 'Acme',
      jobTitle: 'Analista <Dados>',
      message: 'Olá <b>Ana</b>\nlinha 2\n\nSegundo parágrafo',
    });
    expect(email.subject).toBe('Retorno sobre a sua candidatura: Analista <Dados>');
    expect(email.html).toContain('Olá &lt;b&gt;Ana&lt;/b&gt;<br>linha 2');
    expect(email.html).toContain('Segundo parágrafo</p>');
    expect(email.html).not.toContain('<b>Ana</b>');
    expect(email.html).toContain('Mensagem enviada por Acme pelo Job Match');
    expect(email.text).toContain('Olá <b>Ana</b>');
    expect(email.text).toContain('--\nMensagem enviada por Acme');
  });

  it('uses another subject for the honest update', () => {
    const email = renderBatchFeedbackEmail({
      kind: 'update',
      companyName: null,
      jobTitle: 'Dev',
      message: 'Seguimos analisando.',
    });
    expect(email.subject).toBe('Atualização sobre a sua candidatura: Dev');
    expect(email.text).toContain('Mensagem enviada por a empresa');
  });
});

const APPLICATION: ApplicationInfo = {
  id: APP_1,
  stage: 'screening',
  candidateId: 'cand-1',
  jobTitle: 'Analista de Dados',
  companyName: 'Acme',
};

function item(overrides: Partial<BatchItem> = {}): BatchItem {
  return {
    applicationId: APP_1,
    kind: 'decision',
    reasonCode: 'better_fit',
    message: MESSAGE,
    newDueAt: null,
    ...overrides,
  };
}

function makeDeps(overrides: Partial<BatchDeps> = {}) {
  const deps = {
    loadApplication: vi.fn(async () => APPLICATION),
    getCandidateEmail: vi.fn(async () => 'ana@exemplo.com'),
    claimLog: vi.fn(async () => ({ id: 'log-1' })),
    recordDecision: vi.fn(async () => {}),
    recordUpdate: vi.fn(async () => {}),
    send: vi.fn(async () => ({ id: 'prov-1' })),
    finishLog: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    ...overrides,
  };
  return deps;
}

const CONTEXT = {
  recruiterId: 'rec-1',
  recruiterEmail: 'rec@acme.com',
  from: 'Job Match <avisos@mail.jobmatchrh.com>',
  quota: 100,
};

describe('processBatch', () => {
  it('records the decision in the app, sends the e-mail and logs it', async () => {
    const deps = makeDeps();
    const summary = await processBatch(deps, CONTEXT, [item()]);

    expect(summary).toMatchObject({ sent: 1, failed: 0, skipped_duplicate: 0, skipped_limit: 0 });
    expect(summary.results).toEqual([{ application_id: APP_1, status: 'sent', in_app: true }]);
    expect(deps.claimLog).toHaveBeenCalledWith({
      recruiterId: 'rec-1',
      toEmail: 'ana@exemplo.com',
      applicationId: APP_1,
      stage: 'screening',
      kind: 'decision',
    });
    expect(deps.recordDecision).toHaveBeenCalledWith({
      applicationId: APP_1,
      message: MESSAGE,
      reasonCode: 'better_fit',
    });
    const payload = deps.send.mock.calls[0]?.[0];
    expect(payload?.from).toBe('"Acme via Job Match" <avisos@mail.jobmatchrh.com>');
    expect(payload?.to).toEqual(['ana@exemplo.com']);
    expect(payload?.reply_to).toBe('rec@acme.com');
    expect(deps.finishLog).toHaveBeenCalledWith('log-1', { status: 'sent', providerId: 'prov-1' });
    expect(deps.pause).toHaveBeenCalledTimes(1);
  });

  it('uses recordUpdate for the honest update', async () => {
    const deps = makeDeps();
    await processBatch(deps, CONTEXT, [
      item({ kind: 'update', reasonCode: null, newDueAt: '2026-10-20T12:00:00.000Z' }),
    ]);
    expect(deps.recordUpdate).toHaveBeenCalledWith({
      applicationId: APP_1,
      message: MESSAGE,
      newDueAt: '2026-10-20T12:00:00.000Z',
    });
    expect(deps.recordDecision).not.toHaveBeenCalled();
  });

  it('does not send twice for a decision that was already sent', async () => {
    const deps = makeDeps({ claimLog: vi.fn(async () => 'duplicate' as const) });
    const summary = await processBatch(deps, CONTEXT, [item()]);
    expect(summary.skipped_duplicate).toBe(1);
    expect(deps.recordDecision).not.toHaveBeenCalled();
    expect(deps.send).not.toHaveBeenCalled();
  });

  it('skips what does not fit in the hourly limit and does not touch it', async () => {
    const deps = makeDeps();
    const second = item({ applicationId: APP_2 });
    const summary = await processBatch(deps, { ...CONTEXT, quota: 1 }, [item(), second]);
    expect(summary).toMatchObject({ sent: 1, skipped_limit: 1 });
    expect(deps.loadApplication).toHaveBeenCalledTimes(1);
  });

  it('fails the item when the application is not the recruiter\'s', async () => {
    const deps = makeDeps({ loadApplication: vi.fn(async () => null) });
    const summary = await processBatch(deps, CONTEXT, [item()]);
    expect(summary.results).toEqual([
      { application_id: APP_1, status: 'failed', error: 'application_not_found' },
    ]);
    expect(deps.claimLog).not.toHaveBeenCalled();
  });

  it('fails the item when the candidate has no valid e-mail', async () => {
    const deps = makeDeps({ getCandidateEmail: vi.fn(async () => null) });
    const summary = await processBatch(deps, CONTEXT, [item()]);
    expect(summary.results[0]).toMatchObject({ status: 'failed', error: 'no_recipient' });
    expect(deps.recordDecision).not.toHaveBeenCalled();
  });

  it('does not send the e-mail when the database refuses the record', async () => {
    const deps = makeDeps({
      recordUpdate: vi.fn(async () => {
        throw new Error('postpone_limit_reached');
      }),
    });
    const summary = await processBatch(deps, CONTEXT, [
      item({ kind: 'update', reasonCode: null, newDueAt: '2026-10-20T12:00:00.000Z' }),
    ]);
    expect(summary.results).toEqual([
      { application_id: APP_1, status: 'failed', error: 'postpone_limit_reached', in_app: false },
    ]);
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.finishLog).toHaveBeenCalledWith('log-1', {
      status: 'failed',
      error: 'record_failed: postpone_limit_reached',
    });
  });

  it('keeps the in-app record and logs a failure when only the e-mail fails', async () => {
    const deps = makeDeps({
      send: vi.fn(async () => {
        throw new Error('domain not verified');
      }),
    });
    const summary = await processBatch(deps, CONTEXT, [item()]);
    expect(summary.results).toEqual([
      { application_id: APP_1, status: 'failed', error: 'email_failed', in_app: true },
    ]);
    expect(deps.finishLog).toHaveBeenCalledWith('log-1', {
      status: 'failed',
      error: 'domain not verified',
    });
  });

  it('puts the rejected items first and counts them in the summary', async () => {
    const deps = makeDeps();
    const summary = await processBatch(deps, CONTEXT, [item()], [
      { application_id: APP_2, status: 'failed', error: 'invalid_item' },
      { application_id: APP_2, status: 'skipped_duplicate', error: 'duplicate_in_batch' },
    ]);
    expect(summary).toMatchObject({ sent: 1, failed: 1, skipped_duplicate: 1, skipped_limit: 0 });
    expect(summary.results).toHaveLength(3);
  });

  it('omits reply_to when the recruiter has no valid e-mail', async () => {
    const deps = makeDeps();
    await processBatch(deps, { ...CONTEXT, recruiterEmail: null }, [item()]);
    expect(deps.send.mock.calls[0]?.[0]).not.toHaveProperty('reply_to');
  });
});