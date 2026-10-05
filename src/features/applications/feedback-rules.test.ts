import { describe, expect, it } from 'vitest';
import {
  FEEDBACK_MAX_LENGTH,
  isFeedbackRequired,
  validateFeedback,
} from './feedback-rules';

describe('isFeedbackRequired', () => {
  it('is required only when rejecting', () => {
    expect(isFeedbackRequired('Rejeitado')).toBe(true);
    expect(isFeedbackRequired('Triagem')).toBe(false);
    expect(isFeedbackRequired('Aprovado')).toBe(false);
  });
});

describe('validateFeedback', () => {
  it('accepts an empty feedback when advancing', () => {
    expect(validateFeedback('   ', 'Triagem')).toBeNull();
  });

  it('rejects an empty feedback when rejecting', () => {
    expect(validateFeedback('', 'Rejeitado')).not.toBeNull();
  });

  it('rejects text that is too short', () => {
    expect(validateFeedback('ok', 'Triagem')).not.toBeNull();
  });

  it('rejects text that is too long', () => {
    expect(
      validateFeedback('a'.repeat(FEEDBACK_MAX_LENGTH + 1), 'Triagem'),
    ).not.toBeNull();
  });

  it('accepts a valid feedback', () => {
    expect(
      validateFeedback('Perfil forte, vamos para a próxima etapa.', 'Triagem'),
    ).toBeNull();
  });
});
