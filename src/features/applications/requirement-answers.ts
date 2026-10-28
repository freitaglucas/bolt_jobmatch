import type { JobRequirementView } from '../../lib/types';
import type { RequirementAnswer } from './apply';

// Resposta sim/nao de cada requisito, pelo id de job_requirements.
export type RequirementPicks = Record<string, boolean | undefined>;

// Uma resposta por requisito, na ordem da vaga. null se faltar alguma.
export function buildRequirementAnswers(
  requirements: JobRequirementView[],
  picks: RequirementPicks,
): RequirementAnswer[] | null {
  const answers: RequirementAnswer[] = [];
  for (const requirement of requirements) {
    const meets = picks[requirement.id];
    if (meets === undefined) {
      return null;
    }
    answers.push({ requirementId: requirement.id, meets });
  }
  return answers;
}

export function countAnswered(requirements: JobRequirementView[], picks: RequirementPicks): number {
  return requirements.filter((requirement) => picks[requirement.id] !== undefined).length;
}

export interface RejectionNotice {
  title: string;
  body: string;
}

// Aviso mostrado na hora em que a candidatura e recusada por um requisito
// excludente (N31). Cita so requisitos da vaga, nunca algo pessoal.
export function rejectionNotice(jobTitle: string, unmet: string[]): RejectionNotice {
  const list = unmet.length > 0 ? unmet.join('; ') : 'um requisito excludente';
  const verb =
    unmet.length > 1
      ? 'esses requisitos não foram atendidos'
      : 'esse requisito não foi atendido';
  return {
    title: 'Sua candidatura não seguiu',
    body: `A vaga ${jobTitle} exige: ${list}. Pela sua resposta, ${verb}, por isso a candidatura não seguiu. O retorno também fica em Minhas candidaturas.`,
  };
}
