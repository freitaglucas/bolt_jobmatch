// Candidatura pela funcao apply_to_job (N31): a candidatura e as respostas aos
// requisitos sim/nao da vaga vao juntas. Resposta "nao" a um requisito
// excludente recusa a candidatura na hora, com retorno de motivo.

export interface CreatedApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  match_score: number;
  created_at: string;
}

export interface RequirementAnswer {
  requirementId: string;
  meets: boolean;
}

export interface ApplyResult {
  application: CreatedApplication;
  created: boolean;
  autoRejected: boolean;
  unmetRequirements: string[];
}

export function toAnswersPayload(
  answers: RequirementAnswer[],
): { requirement_id: string; meets: boolean }[] {
  return answers.map((answer) => ({
    requirement_id: answer.requirementId,
    meets: answer.meets,
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseApplyResult(raw: unknown): ApplyResult {
  if (
    !isRecord(raw) ||
    typeof raw.id !== 'string' ||
    typeof raw.job_id !== 'string' ||
    typeof raw.candidate_id !== 'string' ||
    typeof raw.created_at !== 'string' ||
    typeof raw.created !== 'boolean'
  ) {
    throw new Error('Resposta inesperada ao enviar a candidatura.');
  }

  const unmet = Array.isArray(raw.unmet_requirements)
    ? raw.unmet_requirements.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    application: {
      id: raw.id,
      job_id: raw.job_id,
      candidate_id: raw.candidate_id,
      match_score: Number(raw.match_score ?? 0),
      created_at: raw.created_at,
    },
    created: raw.created,
    autoRejected: raw.auto_rejected === true,
    unmetRequirements: unmet,
  };
}

const APPLY_ERROR_MESSAGES: Record<string, string> = {
  requirements_unanswered: 'Responda todos os requisitos da vaga para se candidatar.',
  job_not_active: 'Esta vaga não está mais recebendo candidaturas.',
  not_allowed: 'Entre com uma conta de candidato para se candidatar.',
  invalid_answers: 'Não foi possível ler suas respostas. Tente de novo.',
};

// Mensagem em PT-BR para os erros conhecidos de apply_to_job; null nos outros.
export function applyErrorMessage(error: { message?: string } | null | undefined): string | null {
  const message = error?.message ?? '';
  return APPLY_ERROR_MESSAGES[message] ?? null;
}