import type { ApplicationStatus } from '../../lib/types';

// Fluxo feliz do funil. Aprovado e Rejeitado sao finais.
const NEXT_STAGE: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  'Em análise': 'Triagem',
  Triagem: 'Entrevista',
  Entrevista: 'Final',
  Final: 'Aprovado',
};

export function getNextStage(stage: ApplicationStatus): ApplicationStatus | null {
  return NEXT_STAGE[stage] ?? null;
}

export function canReject(stage: ApplicationStatus): boolean {
  return stage !== 'Aprovado' && stage !== 'Rejeitado';
}
