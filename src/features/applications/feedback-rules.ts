import type { ApplicationStatus } from '../../lib/types';

export const FEEDBACK_MAX_LENGTH = 1000;
export const FEEDBACK_MIN_LENGTH = 10;

// Rejeitar exige feedback (nao deixar o candidato sem resposta);
// avancar de etapa, nao.
export function isFeedbackRequired(targetStage: ApplicationStatus): boolean {
  return targetStage === 'Rejeitado';
}

// Devolve a mensagem de erro, ou null se estiver valido.
export function validateFeedback(
  text: string,
  targetStage: ApplicationStatus,
): string | null {
  const value = text.trim();
  if (value.length === 0) {
    return isFeedbackRequired(targetStage)
      ? 'Escreva um feedback para o candidato antes de rejeitar.'
      : null;
  }
  if (value.length < FEEDBACK_MIN_LENGTH) {
    return `O feedback precisa ter pelo menos ${FEEDBACK_MIN_LENGTH} caracteres.`;
  }
  if (value.length > FEEDBACK_MAX_LENGTH) {
    return `O feedback pode ter no máximo ${FEEDBACK_MAX_LENGTH} caracteres.`;
  }
  return null;
}
