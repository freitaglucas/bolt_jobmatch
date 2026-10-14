import { describe, expect, it } from 'vitest';
import { batchItemErrorLabel, batchRequestErrorMessage } from './batch-feedback.errors';

describe('batchRequestErrorMessage', () => {
  it('explains the common statuses', () => {
    expect(batchRequestErrorMessage(401)).toContain('sessão expirou');
    expect(batchRequestErrorMessage(403)).toContain('não foi aprovada');
    expect(batchRequestErrorMessage(400)).toContain('não foi aceito');
    expect(batchRequestErrorMessage(500)).toContain('não foi configurado');
    expect(batchRequestErrorMessage(undefined)).toContain('Tente de novo');
  });
});

describe('batchItemErrorLabel', () => {
  it('translates the server codes and falls back to a generic text', () => {
    expect(batchItemErrorLabel('postpone_limit_reached')).toContain('2 adiamentos');
    expect(batchItemErrorLabel('already_sent')).toContain('já recebeu');
    expect(batchItemErrorLabel('algo_novo')).toBe('Não foi possível enviar este retorno.');
    expect(batchItemErrorLabel(undefined)).toBe('Não foi possível enviar este retorno.');
  });
});
