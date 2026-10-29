// Casos de paridade do Match Score (item N2).
//
// A MESMA lista de casos roda em dois lugares:
//   1) TypeScript: src/features/match/lib/calculateMatch.parity.test.ts
//   2) Banco (pgTAP): supabase/tests/match_parity.test.sql
// O teste em TypeScript tambem confere que o arquivo SQL tem os mesmos casos,
// com os mesmos dados e os mesmos scores. Se a formula mudar, atualize os
// DOIS lados e os scores esperados aqui.
//
// As competencias usam as chaves 'A' a 'D'. No banco elas viram as skills
// 'Paridade A' a 'Paridade D'. Itens com a mesma chave "group" formam um grupo
// de alternativas (N33) com min_count = "min"; o papel do grupo segue o
// "mandatory" dos itens (todos iguais no grupo).
// A ordem das chaves de cada objeto importa: o teste compara o JSON literal.

export interface ParityJobSkill {
  skill: string;
  level: number;
  weight: number;
  mandatory: boolean;
  group?: string;
  min?: number;
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

const groupedSkill = (
  skill: string,
  level: number,
  mandatory: boolean,
  group: string,
  min: number,
): ParityJobSkill => ({ skill, level, weight: 1, mandatory, group, min });

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
      jobSkill('A', 3, 1, true),
      jobSkill('B', 2, 1, false),
      jobSkill('C', 2, 1, false),
    ],
    candidateSkills: [candidateSkill('A', 2), candidateSkill('B', 2)],
    expectedScore: 55.56,
  },
  {
    id: 'importance_weights',
    description: 'Mesma situacao, com a competencia que falta em importancia Baixa',
    jobSkills: [
      jobSkill('A', 3, 1, true),
      jobSkill('B', 2, 0.75, false),
      jobSkill('C', 2, 0.5, false),
    ],
    candidateSkills: [candidateSkill('A', 2), candidateSkill('B', 2)],
    expectedScore: 62.96,
  },
  {
    id: 'mandatory_low_level',
    description: 'Obrigatoria presente em nivel baixo: pontua pela proporcao, sem corte',
    jobSkills: [
      jobSkill('A', 3, 1, true),
      jobSkill('B', 2, 1, false),
    ],
    candidateSkills: [candidateSkill('A', 1), candidateSkill('B', 2)],
    expectedScore: 66.67,
  },
  {
    id: 'mandatory_absent',
    description: 'Obrigatoria ausente: o score cai pela metade',
    jobSkills: [
      jobSkill('A', 3, 1, true),
      jobSkill('B', 2, 1, false),
    ],
    candidateSkills: [candidateSkill('B', 2)],
    expectedScore: 25,
  },
  {
    id: 'evidence_bonus',
    description: 'Projeto comprova a competencia: nivel 2 vira 2,3',
    jobSkills: [jobSkill('A', 3, 1, false)],
    candidateSkills: [candidateSkill('A', 2, true)],
    expectedScore: 76.67,
  },
  {
    id: 'evidence_cap',
    description: 'Bonus de projeto nunca passa do nivel 3 (avancado)',
    jobSkills: [jobSkill('A', 3, 1, false)],
    candidateSkills: [candidateSkill('A', 3, true)],
    expectedScore: 100,
  },
  {
    id: 'level_above_required',
    description: 'Nivel acima do exigido nao passa de 100%',
    jobSkills: [jobSkill('A', 2, 1, false)],
    candidateSkills: [candidateSkill('A', 3)],
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
    jobSkills: [jobSkill('A', 2, 0, false)],
    candidateSkills: [candidateSkill('A', 3)],
    expectedScore: 0,
  },
  {
    id: 'job_without_skills',
    description: 'Vaga sem competencias: score zero',
    jobSkills: [],
    candidateSkills: [candidateSkill('A', 2)],
    expectedScore: 0,
  },
  {
    id: 'mixed_evidence_weights',
    description: 'Peso, bonus de projeto e obrigatoria juntos',
    jobSkills: [
      jobSkill('A', 3, 1, true),
      jobSkill('B', 2, 0.5, false),
    ],
    candidateSkills: [candidateSkill('A', 2, true), candidateSkill('B', 1)],
    expectedScore: 67.78,
  },
  {
    id: 'group_one_of_met',
    description: 'Grupo obrigatorio "1 de A, B, C": ter B basta',
    jobSkills: [
      groupedSkill('A', 2, true, 'g1', 1),
      groupedSkill('B', 2, true, 'g1', 1),
      groupedSkill('C', 2, true, 'g1', 1),
      jobSkill('D', 2, 1, false),
    ],
    candidateSkills: [candidateSkill('B', 2), candidateSkill('D', 1)],
    expectedScore: 75,
  },
  {
    id: 'group_one_of_missing',
    description: 'Grupo obrigatorio sem nenhum item: conta como obrigatoria ausente',
    jobSkills: [
      groupedSkill('A', 2, true, 'g1', 1),
      groupedSkill('B', 2, true, 'g1', 1),
      groupedSkill('C', 2, true, 'g1', 1),
      jobSkill('D', 2, 1, false),
    ],
    candidateSkills: [candidateSkill('D', 2)],
    expectedScore: 25,
  },
  {
    id: 'group_two_of_four',
    description: 'Grupo "2 de 4": media das duas melhores notas',
    jobSkills: [
      groupedSkill('A', 3, true, 'g1', 2),
      groupedSkill('B', 3, true, 'g1', 2),
      groupedSkill('C', 3, true, 'g1', 2),
      groupedSkill('D', 3, true, 'g1', 2),
    ],
    candidateSkills: [candidateSkill('A', 3), candidateSkill('B', 2), candidateSkill('C', 1)],
    expectedScore: 83.33,
  },
  {
    id: 'group_two_of_four_short',
    description: 'Grupo "2 de 4" com um item so: obrigatoria ausente',
    jobSkills: [
      groupedSkill('A', 3, true, 'g1', 2),
      groupedSkill('B', 3, true, 'g1', 2),
      groupedSkill('C', 3, true, 'g1', 2),
      groupedSkill('D', 3, true, 'g1', 2),
    ],
    candidateSkills: [candidateSkill('A', 3)],
    expectedScore: 25,
  },
  {
    id: 'group_preferred_with_evidence',
    description: 'Grupo desejavel com bonus de projeto, ao lado de uma obrigatoria',
    jobSkills: [
      groupedSkill('A', 3, false, 'g1', 1),
      groupedSkill('B', 3, false, 'g1', 1),
      jobSkill('C', 2, 1, true),
    ],
    candidateSkills: [candidateSkill('A', 2, true), candidateSkill('C', 2)],
    expectedScore: 88.33,
  },
  {
    id: 'group_min_above_size',
    description: 'Minimo maior que o grupo vale o tamanho do grupo',
    jobSkills: [groupedSkill('A', 2, true, 'g1', 3), groupedSkill('B', 2, true, 'g1', 3)],
    candidateSkills: [candidateSkill('A', 2), candidateSkill('B', 2)],
    expectedScore: 100,
  },
];

