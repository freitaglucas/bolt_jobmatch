// Casos de paridade do Match Score (item N2).
//
// A MESMA lista de casos roda em dois lugares:
//   1) TypeScript: src/features/match/lib/calculateMatch.parity.test.ts
//   2) Banco (pgTAP): supabase/tests/match_parity.test.sql
// O teste em TypeScript tambem confere que o arquivo SQL tem os mesmos casos,
// com os mesmos dados e os mesmos scores. Se a formula mudar, atualize os
// DOIS lados e os scores esperados aqui.
//
// As competencias usam as chaves 'A', 'B' e 'C'. No banco elas viram as
// skills 'Paridade A', 'Paridade B' e 'Paridade C'.
// A ordem das chaves de cada objeto importa: o teste compara o JSON literal.

export interface ParityJobSkill {
  skill: string;
  level: number;
  weight: number;
  mandatory: boolean;
}

export interface ParityCandidateSkill {
  skill: string;
  level: number;
  evidenced: boolean;
}

export interface ParityCase {
  id: string;
  description: string;
  jobSkills: ParityJobSkill[];
  candidateSkills: ParityCandidateSkill[];
  expectedScore: number;
}

const jobSkill = (
  skill: string,
  level: number,
  weight: number,
  mandatory: boolean,
): ParityJobSkill => ({ skill, level, weight, mandatory });

const candidateSkill = (
  skill: string,
  level: number,
  evidenced = false,
): ParityCandidateSkill => ({ skill, level, evidenced });

export const PARITY_CASES: ParityCase[] = [
  {
    id: 'same_weights',
    description: 'Pesos iguais; falta uma competencia opcional',
    jobSkills: [
      jobSkill('A', 4, 1, true),
      jobSkill('B', 3, 1, false),
      jobSkill('C', 3, 1, false),
    ],
    candidateSkills: [candidateSkill('A', 3), candidateSkill('B', 3)],
    expectedScore: 58.33,
  },
  {
    id: 'importance_weights',
    description: 'Mesma situacao, com a competencia que falta em importancia Baixa',
    jobSkills: [
      jobSkill('A', 4, 1, true),
      jobSkill('B', 3, 0.75, false),
      jobSkill('C', 3, 0.5, false),
    ],
    candidateSkills: [candidateSkill('A', 3), candidateSkill('B', 3)],
    expectedScore: 66.67,
  },
  {
    id: 'mandatory_low_level',
    description: 'Obrigatoria presente em nivel baixo: pontua pela proporcao, sem corte',
    jobSkills: [jobSkill('A', 4, 1, true), jobSkill('B', 3, 1, false)],
    candidateSkills: [candidateSkill('A', 1), candidateSkill('B', 3)],
    expectedScore: 62.5,
  },
  {
    id: 'mandatory_absent',
    description: 'Obrigatoria ausente: o score cai pela metade',
    jobSkills: [jobSkill('A', 4, 1, true), jobSkill('B', 3, 1, false)],
    candidateSkills: [candidateSkill('B', 3)],
    expectedScore: 25,
  },
  {
    id: 'evidence_bonus',
    description: 'Projeto comprova a competencia: nivel 4 vira 4,6',
    jobSkills: [jobSkill('A', 5, 1, false)],
    candidateSkills: [candidateSkill('A', 4, true)],
    expectedScore: 92,
  },
  {
    id: 'evidence_cap',
    description: 'Bonus de projeto nunca passa do nivel 5',
    jobSkills: [jobSkill('A', 5, 1, false)],
    candidateSkills: [candidateSkill('A', 5, true)],
    expectedScore: 100,
  },
  {
    id: 'level_above_required',
    description: 'Nivel acima do exigido nao passa de 100%',
    jobSkills: [jobSkill('A', 3, 1, false)],
    candidateSkills: [candidateSkill('A', 5)],
    expectedScore: 100,
  },
  {
    id: 'one_third',
    description: 'Arredondamento de 33,333... para 33,33',
    jobSkills: [jobSkill('A', 3, 1, false)],
    candidateSkills: [candidateSkill('A', 1)],
    expectedScore: 33.33,
  },
  {
    id: 'zero_weights',
    description: 'Soma dos pesos igual a zero: score zero',
    jobSkills: [jobSkill('A', 3, 0, false)],
    candidateSkills: [candidateSkill('A', 4)],
    expectedScore: 0,
  },
  {
    id: 'job_without_skills',
    description: 'Vaga sem competencias: score zero',
    jobSkills: [],
    candidateSkills: [candidateSkill('A', 3)],
    expectedScore: 0,
  },
  {
    id: 'mixed_evidence_weights',
    description: 'Peso, bonus de projeto e obrigatoria juntos',
    jobSkills: [jobSkill('A', 4, 1, true), jobSkill('B', 3, 0.5, false)],
    candidateSkills: [candidateSkill('A', 3, true), candidateSkill('B', 2)],
    expectedScore: 79.72,
  },
];
