import { MAX_POSTPONES_PER_STAGE } from '../applications/batch-feedback';
import { GOAL_PERCENT } from '../feedback-goal/goal-rules';
import { SLA_DAYS } from '../deadlines/sla';

export interface LandingPoint {
  title: string;
  text: string;
}

export const HERO_TITLE = 'Nenhum candidato fica sem resposta.';

export const HERO_SUBTITLE =
  'O Job Match é um sistema de recrutamento para pequenas e médias empresas, para vagas do operacional à gerência. Todo candidato ativo tem um prazo de retorno, e a empresa responde com motivo.';

export const CANDIDATE_STEPS: string[] = [
  'Crie seu perfil com as suas competências e o nível de cada uma.',
  'Veja as vagas e a compatibilidade com cada uma, explicada por competência.',
  'Candidate-se às vagas que fazem sentido para você.',
  'Acompanhe a etapa e a data do próximo retorno em Candidaturas.',
];

export const COMPANY_STEPS: string[] = [
  'Cadastre-se, aguarde a aprovação do acesso e informe os dados da empresa.',
  'Publique a vaga com as competências exigidas e o nível de cada uma.',
  'Receba candidatos com a compatibilidade de cada um e mova-os pelas etapas do Pipeline.',
  'Dê retorno a cada candidato dentro do prazo, um a um ou em lote, sempre com motivo.',
];

export const RETURN_POINTS: LandingPoint[] = [
  {
    title: 'Um prazo para cada candidato',
    text: `Todo candidato ativo tem uma data de próximo retorno, de até ${SLA_DAYS} dias por etapa. Ela aparece para a empresa e para o candidato.`,
  },
  {
    title: 'Mais tempo, sem sumir',
    text: `Se a empresa precisar de mais tempo, avisa o candidato com uma nova data. São até ${MAX_POSTPONES_PER_STAGE} adiamentos por etapa.`,
  },
  {
    title: 'Retorno com motivo',
    text: 'Quem não avança recebe uma resposta com o motivo, nunca o silêncio. Ao encerrar uma vaga, todos recebem o retorno final.',
  },
  {
    title: 'Selo público na vaga',
    text: `Empresas que mantêm ${GOAL_PERCENT}% dos retornos no prazo ganham um selo na página da vaga.`,
  },
];
