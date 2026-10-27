// Motivos do "nao avancou" em lote (N62). Regras puras e fixas, sem IA: o
// sistema sugere um dos 5 motivos a partir do que o candidato informou no
// perfil, a recrutadora confirma por grupo e cada candidato recebe a propria
// mensagem. Nunca leva numero ou score.

import { skillLevelName } from '../skills/levels';

// Os codigos precisam ser iguais aos de feedbacks_reason_code_check (migration
// 20261008000000_feedback_deadlines.sql) e aos de _shared/batch-feedback.ts.
export const REASON_CODES = [
  'missing_required',
  'level_below',
  'eliminatory',
  'better_fit',
  'job_closed',
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

export const REASON_LABELS: Record<ReasonCode, string> = {
  missing_required: 'Falta item essencial da vaga',
  level_below: 'Competência abaixo do nível pedido',
  eliminatory: 'Requisito da vaga (local, disponibilidade ou idioma)',
  better_fit: 'Outro perfil mais completo',
  job_closed: 'Vaga encerrada',
};

// O que cada grupo vai citar na mensagem (ajuda a recrutadora a confirmar).
export const REASON_HINTS: Record<ReasonCode, string> = {
  missing_required: 'Cita até 3 itens essenciais que não apareceram no perfil.',
  level_below: 'Cita a competência, o nível informado e o nível pedido.',
  eliminatory: 'Avisa que um requisito da vaga não foi atendido, sem detalhar dados pessoais.',
  better_fit: 'Reconhece o perfil, cita pontos fortes e convida para as próximas vagas.',
  job_closed: 'Aviso neutro de que a vaga foi encerrada.',
};

// Regua de 3 niveis (N30), em minusculas para caber no meio da frase.
export function levelLabel(level: number): string {
  return skillLevelName(level).toLocaleLowerCase('pt-BR');
}

export interface JobSkillInput {
  skillName: string;
  requiredLevel: number;
  weight: number;
  mandatory: boolean;
}

export interface CandidateSkillInput {
  skillName: string;
  declaredLevel: number;
}

export interface BelowLevelItem {
  skill: string;
  required: number;
  declared: number;
}

export interface MatchInsights {
  // Itens do nucleo (obrigatorios) que o candidato nao informou.
  missing: string[];
  // Competencias informadas abaixo do nivel pedido.
  below: BelowLevelItem[];
  // Competencias informadas no nivel pedido ou acima.
  strengths: string[];
}

export const EMPTY_INSIGHTS: MatchInsights = { missing: [], below: [], strengths: [] };

function normalize(name: string): string {
  return name.trim().toLocaleLowerCase();
}

// Lacunas e pontos fortes de um candidato frente aos requisitos da vaga, na
// mesma base do calculo do match (nome sem diferenciar maiusculas).
export function buildMatchInsights(
  jobSkills: readonly JobSkillInput[],
  candidateSkills: readonly CandidateSkillInput[],
): MatchInsights {
  const declaredByName = new Map<string, number>();
  for (const skill of candidateSkills) {
    declaredByName.set(normalize(skill.skillName), skill.declaredLevel);
  }

  const missing: { skill: string; weight: number }[] = [];
  const below: (BelowLevelItem & { weight: number; mandatory: boolean })[] = [];
  const strengths: { skill: string; weight: number; declared: number }[] = [];

  for (const jobSkill of jobSkills) {
    const declared = declaredByName.get(normalize(jobSkill.skillName)) ?? 0;
    if (declared <= 0) {
      if (jobSkill.mandatory) {
        missing.push({ skill: jobSkill.skillName, weight: jobSkill.weight });
      }
      continue;
    }
    if (declared < jobSkill.requiredLevel) {
      below.push({
        skill: jobSkill.skillName,
        required: jobSkill.requiredLevel,
        declared,
        weight: jobSkill.weight,
        mandatory: jobSkill.mandatory,
      });
      continue;
    }
    strengths.push({ skill: jobSkill.skillName, weight: jobSkill.weight, declared });
  }

  return {
    missing: missing
      .sort((a, b) => b.weight - a.weight || a.skill.localeCompare(b.skill, 'pt-BR'))
      .map((item) => item.skill),
    below: below
      .sort(
        (a, b) =>
          Number(b.mandatory) - Number(a.mandatory) ||
          b.required - b.declared - (a.required - a.declared) ||
          b.weight - a.weight ||
          a.skill.localeCompare(b.skill, 'pt-BR'),
      )
      .map(({ skill, required, declared }) => ({ skill, required, declared })),

    strengths: strengths
      .sort(
        (a, b) =>
          b.weight - a.weight || b.declared - a.declared || a.skill.localeCompare(b.skill, 'pt-BR'),
      )
      .map((item) => item.skill),
  };
}

// Regra fixa de sugestao. "Requisito sim/nao" (eliminatory) e "vaga encerrada"
// (job_closed) nao saem dos dados do match: a recrutadora escolhe.
export function suggestReason(insights: MatchInsights): ReasonCode {
  if (insights.missing.length > 0) {
    return 'missing_required';
  }
  if (insights.below.length > 0) {
    return 'level_below';
  }
  return 'better_fit';
}

export interface ReasonCandidate {
  id: string;
}

// Motivo de cada candidato: o que a recrutadora escolheu, ou a sugestao.
export function resolveReasons(
  candidates: readonly ReasonCandidate[],
  insightsById: Readonly<Record<string, MatchInsights | undefined>>,
  overrides: Readonly<Record<string, ReasonCode | undefined>>,
): Record<string, ReasonCode> {
  const reasons: Record<string, ReasonCode> = {};
  for (const candidate of candidates) {
    reasons[candidate.id] =
      overrides[candidate.id] ?? suggestReason(insightsById[candidate.id] ?? EMPTY_INSIGHTS);
  }
  return reasons;
}

export interface ReasonGroup<T extends ReasonCandidate> {
  reason: ReasonCode;
  candidates: T[];
}

// Grupos nao vazios, sempre na ordem fixa dos motivos.
export function groupByReason<T extends ReasonCandidate>(
  candidates: readonly T[],
  reasons: Readonly<Record<string, ReasonCode>>,
): ReasonGroup<T>[] {
  const groups: ReasonGroup<T>[] = [];
  for (const reason of REASON_CODES) {
    const members = candidates.filter((candidate) => reasons[candidate.id] === reason);
    if (members.length > 0) {
      groups.push({ reason, candidates: members });
    }
  }
  return groups;
}

export function allGroupsConfirmed(
  groups: readonly { reason: ReasonCode }[],
  confirmed: ReadonlySet<ReasonCode>,
): boolean {
  return groups.length > 0 && groups.every((group) => confirmed.has(group.reason));
}

// "A", "A e B", "A, B e C".
export function joinList(items: readonly string[]): string {
  if (items.length <= 1) {
    return items[0] ?? '';
  }
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

const PROFILE_INVITE =
  'Se o seu perfil mudou ou ficou incompleto, atualize-o no Job Match: a sua próxima candidatura considera o que estiver lá.';

export interface RejectionBodyInput {
  reason: ReasonCode;
  insights: MatchInsights;
  jobTitle: string;
  includeStrengths: boolean;
}

// Corpo da mensagem (sem abertura e fechamento, que a recrutadora edita).
// Frase-chave: "com base no que voce informou no perfil".
export function buildRejectionBody(input: RejectionBodyInput): string {
  const { reason, insights, includeStrengths } = input;
  const job = input.jobTitle.trim() || 'vaga';
  const parts: string[] = [];

  switch (reason) {
    case 'missing_required': {
      const items = insights.missing.slice(0, 3);
      parts.push(
        `Agradecemos a sua candidatura à vaga ${job}. Desta vez você não seguirá no processo.`,
      );
      parts.push(
        items.length > 0
          ? `Com base no que você informou no perfil, não encontramos ${joinList(items)}, ${items.length === 1 ? 'que é um item essencial' : 'que são itens essenciais'} para esta vaga.`
          : 'Com base no que você informou no perfil, não encontramos um item essencial para esta vaga.',
      );
      break;
    }
    case 'level_below': {
      const items = insights.below.slice(0, 2);
      parts.push(
        `Agradecemos a sua candidatura à vaga ${job}. Desta vez você não seguirá no processo.`,
      );
      parts.push(
        items.length > 0
          ? items
              .map(
                (item) =>
                  `Com base no que você informou no perfil, em ${item.skill} o seu nível é ${levelLabel(item.declared)} e a vaga pede nível ${levelLabel(item.required)}.`,
              )
              .join(' ')
          : 'Com base no que você informou no perfil, uma competência essencial aparece abaixo do nível que a vaga pede.',
      );
      break;
    }
    case 'eliminatory':
      parts.push(
        `Agradecemos a sua candidatura à vaga ${job}. Desta vez você não seguirá no processo.`,
      );
      parts.push(
        'Esta vaga tem um requisito que define quem pode seguir, como localização, disponibilidade ou idioma, e, com base no que você informou no perfil, ele não foi atendido neste momento.',
      );
      break;
    case 'better_fit':
      parts.push(
        `Agradecemos a sua candidatura à vaga ${job}. O seu perfil é bom, mas, neste momento, seguimos com outro perfil mais completo para o que a vaga pede.`,
      );
      break;
    case 'job_closed':
      parts.push(
        `A vaga ${job} foi encerrada e, por isso, o seu processo também. Agradecemos o seu interesse.`,
      );
      break;
  }

  if (includeStrengths && reason !== 'job_closed' && insights.strengths.length > 0) {
    parts.push(
      `Entre os pontos fortes que vimos no seu perfil estão ${joinList(insights.strengths.slice(0, 3))}.`,
    );
  }

  if (reason === 'better_fit') {
    parts.push(
      'Convidamos você a seguir de olho nas nossas próximas vagas e a manter o seu perfil atualizado.',
    );
  } else if (reason !== 'job_closed') {
    parts.push(PROFILE_INVITE);
  }

  return parts.join(' ');
}
