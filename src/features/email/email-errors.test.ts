import { describe, expect, it } from 'vitest';
import { emailErrorMessage } from './email-errors';

describe('emailErrorMessage', () => {
  it('explains the known statuses', () => {
    expect(emailErrorMessage(401)).toContain('sessão expirou');
    expect(emailErrorMessage(403)).toContain('não foi aprovada');
    expect(emailErrorMessage(429)).toContain('Limite');
    expect(emailErrorMessage(500)).toContain('não foi configurado');
  });

  it('falls back to a generic message', () => {
    expect(emailErrorMessage(502)).toBe('Não foi possível enviar o e-mail. Tente de novo.');
    expect(emailErrorMessage(undefined)).toBe('Não foi possível enviar o e-mail. Tente de novo.');
  });
});
