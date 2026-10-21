import { describe, expect, it, vi } from 'vitest';
import {
  formatNoticeDate,
  parseStageUpdateRequest,
  processStageUpdate,
  renderStageUpdateEmail,
  type StageUpdateApplication,
  type StageUpdateDeps,
} from './stage-update.ts';

const APP = '11111111-1111-4111-8111-111111111111';

function application(overrides: Partial<StageUpdateApplication> = {}): StageUpdateApplication {
  return {
    id: APP,
    stage: 'interview',
    candidateId: 'cand-1',
    candidateName: 'Maria Souza',
    jobTitle: 'Analista de Dados',
    companyName: 'Acme',
    ...overrides,
  };
}

function makeDeps(overrides: Partial<StageUpdateDeps> = {}): StageUpdateDeps {
  return {
    loadApplication: vi.fn().mockResolvedValue(application()),
    loadOpenDueAt: vi.fn().mockResolvedValue('2026-10-20T21:00:00Z'),
    getCandidateEmail: vi.fn().mockResolvedValue('maria@example.com'),
    claimLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
    send: vi.fn().mockResolvedValue({ id: 'prov-1' }),
    finishLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const CONTEXT = {
  recruiterId: 'rec-1',
  recruiterEmail: 'recruiter@acme.com',
  from: 'Job Match <avisos@mail.jobmatchrh.com>',
};

describe('parseStageUpdateRequest', () => {
  it('accepts a uuid (lowercased) and refuses anything else', () => {
    expect(parseStageUpdateRequest(APP.toUpperCase())).toBe(APP);
    expect(parseStageUpdateRequest('abc')).toBeNull();
    expect(parseStageUpdateRequest(undefined)).toBeNull();
    expect(parseStageUpdateRequest(42)).toBeNull();
  });
});

describe('formatNoticeDate', () => {
  it('shows the day in Sao Paulo time', () => {
    expect(formatNoticeDate('2026-10-20T21:00:00Z')).toBe('20/10/2026');
    // 01h UTC ainda e o dia anterior em Sao Paulo.
    expect(formatNoticeDate('2026-10-21T01:00:00Z')).toBe('20/10/2026');
  });
});

describe('renderStageUpdateEmail', () => {
  const base = {
    candidateName: 'Maria Souza',
    companyName: 'Acme',
    jobTitle: 'Analista de Dados',
    stageLabel: 'Entrevista',
    dueAt: '2026-10-20T21:00:00Z',
  };

  it('says the new stage, the job and the next return date', () => {
    const email = renderStageUpdateEmail(base);
    expect(email.subject).toBe('Você avançou no processo: Analista de Dados · Próximo retorno até 20/10');
    expect(email.text).toContain('Olá, Maria!');
    expect(email.text).toContain('Você avançou no processo da vaga Analista de Dados.');
    expect(email.text).toContain('Você chegou à etapa Entrevista\nPróximo retorno até 20/10');
    expect(email.text).toContain('na empresa Acme');
    expect(email.html).toContain('Próximo retorno até <strong>20/10</strong>');
    expect(email.html).not.toContain('Ver minha candidatura');
  });

  it('adds the "Ver minha candidatura" button when APP_URL is set', () => {
    const email = renderStageUpdateEmail({ ...base, appUrl: 'https://jobmatchrh.com' });
    expect(email.html).toContain('href="https://jobmatchrh.com/?tela=candidaturas"');
    expect(email.text).toContain('Ver minha candidatura: https://jobmatchrh.com/?tela=candidaturas');
  });

  it('drops the date sentence when there is no open deadline, and the name when unknown', () => {
    const email = renderStageUpdateEmail({ ...base, dueAt: null, candidateName: null });
    expect(email.text).toContain('Olá!');
    expect(email.text).not.toContain('Próximo retorno');
    expect(email.subject).toBe('Você avançou no processo: Analista de Dados');
  });

  it('escapes the job title in the html and never carries a score', () => {
    const email = renderStageUpdateEmail({ ...base, jobTitle: '<b>Vaga</b> & Cia' });
    expect(email.html).not.toContain('<b>Vaga</b>');
    expect(email.html).toContain('&lt;b&gt;Vaga&lt;/b&gt; &amp; Cia');
    expect(email.text).not.toMatch(/score|pontos|%/i);
  });
});

describe('processStageUpdate', () => {
  it('sends the notice as "<Empresa> via Job Match" with Reply-To and logs it', async () => {
    const deps = makeDeps();
    const result = await processStageUpdate(deps, CONTEXT, APP);

    expect(result).toEqual({ status: 'sent' });
    expect(deps.claimLog).toHaveBeenCalledWith({
      recruiterId: 'rec-1',
      toEmail: 'maria@example.com',
      applicationId: APP,
      stage: 'interview',
    });
    const payload = vi.mocked(deps.send).mock.calls[0]?.[0];
    expect(payload?.from).toBe('"Acme via Job Match" <avisos@mail.jobmatchrh.com>');
    expect(payload?.to).toEqual(['maria@example.com']);
    expect(payload?.reply_to).toBe('recruiter@acme.com');
    expect(payload?.text).toContain('etapa Entrevista');
    expect(deps.finishLog).toHaveBeenCalledWith('log-1', { status: 'sent', providerId: 'prov-1' });
  });

  it('refuses an application that is not from the recruiter', async () => {
    const deps = makeDeps({ loadApplication: vi.fn().mockResolvedValue(null) });
    expect(await processStageUpdate(deps, CONTEXT, APP)).toEqual({
      status: 'failed',
      error: 'application_not_found',
    });
    expect(deps.send).not.toHaveBeenCalled();
  });

  it('does not notify stages without an "advanced" notice (approved, rejected, first stage)', async () => {
    for (const stage of ['approved', 'rejected', 'withdrawn', 'new_application']) {
      const deps = makeDeps({ loadApplication: vi.fn().mockResolvedValue(application({ stage })) });
      expect(await processStageUpdate(deps, CONTEXT, APP)).toEqual({
        status: 'skipped',
        error: 'stage_without_notice',
      });
      expect(deps.claimLog).not.toHaveBeenCalled();
    }
  });

  it('fails without sending when the candidate has no valid e-mail', async () => {
    const deps = makeDeps({ getCandidateEmail: vi.fn().mockResolvedValue(null) });
    expect(await processStageUpdate(deps, CONTEXT, APP)).toEqual({
      status: 'failed',
      error: 'no_recipient',
    });
    expect(deps.claimLog).not.toHaveBeenCalled();
  });

  it('never sends twice for the same application and stage', async () => {
    const deps = makeDeps({ claimLog: vi.fn().mockResolvedValue('duplicate') });
    expect(await processStageUpdate(deps, CONTEXT, APP)).toEqual({
      status: 'skipped_duplicate',
      error: 'already_sent',
    });
    expect(deps.send).not.toHaveBeenCalled();
  });

  it('marks the log as failed when the provider fails', async () => {
    const deps = makeDeps({ send: vi.fn().mockRejectedValue(new Error('timeout')) });
    expect(await processStageUpdate(deps, CONTEXT, APP)).toEqual({
      status: 'failed',
      error: 'email_failed',
    });
    expect(deps.finishLog).toHaveBeenCalledWith('log-1', { status: 'failed', error: 'timeout' });
  });

  it('signs as "<Nome>, da <Empresa> via Job Match" when the recruiter has a name (N74)', async () => {
    const deps = makeDeps();
    await processStageUpdate(deps, { ...CONTEXT, recruiterName: 'Ana Lima' }, APP);
    const payload = vi.mocked(deps.send).mock.calls[0]?.[0];
    expect(payload?.from).toBe('"Ana, da Acme via Job Match" <avisos@mail.jobmatchrh.com>');
    expect(payload?.reply_to).toBe('recruiter@acme.com');
  });

  it('omits Reply-To when the recruiter e-mail is not valid', async () => {
    const deps = makeDeps();
    await processStageUpdate(deps, { ...CONTEXT, recruiterEmail: null }, APP);
    expect(vi.mocked(deps.send).mock.calls[0]?.[0]).not.toHaveProperty('reply_to');
  });
});
