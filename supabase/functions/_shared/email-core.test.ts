import { describe, expect, it, vi } from 'vitest';
import {
  EmailSendError,
  MAX_EMAILS_PER_HOUR,
  buildResendPayload,
  escapeHtml,
  isRateLimited,
  isTemplateName,
  isValidEmail,
  renderTemplate,
  sendWithResend,
} from './email-core.ts';

describe('isTemplateName', () => {
  it('accepts only known templates', () => {
    expect(isTemplateName('test')).toBe(true);
    expect(isTemplateName('other')).toBe(false);
    expect(isTemplateName(undefined)).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('validates basic e-mail shape', () => {
    expect(isValidEmail('ana@empresa.com.br')).toBe(true);
    expect(isValidEmail('ana@empresa')).toBe(false);
    expect(isValidEmail('ana empresa@x.com')).toBe(false);
    expect(isValidEmail(42)).toBe(false);
  });
});

describe('renderTemplate', () => {
  it('renders the test template and escapes the recipient name', () => {
    const email = renderTemplate('test', { recipientName: '<b>Ana</b>' });
    expect(email.subject).toBe('Teste de e-mail do Job Match');
    expect(email.html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
    expect(email.html).not.toContain('<b>Ana</b>');
  });

  it('falls back to a generic greeting', () => {
    expect(renderTemplate('test').text).toContain('recrutador(a)');
  });
});

describe('escapeHtml', () => {
  it('escapes the dangerous characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});

describe('buildResendPayload', () => {
  it('wraps the recipient in a list', () => {
    const payload = buildResendPayload('Job Match <a@b.c>', 'x@y.z', renderTemplate('test'));
    expect(payload.to).toEqual(['x@y.z']);
    expect(payload.from).toBe('Job Match <a@b.c>');
  });
});

describe('sendWithResend', () => {
  const payload = buildResendPayload('a@b.c', 'x@y.z', renderTemplate('test'));

  it('posts to Resend with the bearer key and returns the id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'abc-123' }),
    });
    const result = await sendWithResend(fetchMock, 're_key', payload);
    expect(result).toEqual({ id: 'abc-123' });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_key');
    expect(JSON.parse(init.body).to).toEqual(['x@y.z']);
  });

  it('throws EmailSendError with the provider status and message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'domain not verified' }),
    });
    await expect(sendWithResend(fetchMock, 'k', payload)).rejects.toMatchObject({
      name: 'EmailSendError',
      status: 403,
      message: 'domain not verified',
    });
  });

  it('throws when the provider answers without an id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    await expect(sendWithResend(fetchMock, 'k', payload)).rejects.toBeInstanceOf(EmailSendError);
  });
});

describe('isRateLimited', () => {
  it('blocks from the limit onwards', () => {
    expect(isRateLimited(MAX_EMAILS_PER_HOUR - 1)).toBe(false);
    expect(isRateLimited(MAX_EMAILS_PER_HOUR)).toBe(true);
  });
});
