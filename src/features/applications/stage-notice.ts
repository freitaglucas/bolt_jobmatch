import type { ApplicationStatus } from '../../lib/types';
import { getNextStage } from './pipeline-transitions';

// Etapas para onde o candidato "avanca" e recebe o aviso automatico (N71).
// Aprovado e Rejeitado nao usam este aviso: tem retorno proprio.
const NOTICE_STAGES: ReadonlySet<ApplicationStatus> = new Set<ApplicationStatus>([
  'Triagem',
  'Entrevista',
  'Final',
]);

// So avancar para a proxima etapa do funil dispara o aviso. Voltar etapa,
// rejeitar e aprovar nao.
export function shouldNotifyStageChange(
  from: ApplicationStatus | undefined,
  to: ApplicationStatus,
): boolean {
  return from !== undefined && getNextStage(from) === to && NOTICE_STAGES.has(to);
}
