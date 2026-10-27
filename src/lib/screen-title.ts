import type { Screen } from '../components/Layout';

export const APP_NAME = 'Job Match';

const SCREEN_TITLES: Record<Screen, string> = {
  landing: APP_NAME,
  auth: 'Entrar',
  swipe: 'Vagas para você',
  'job-detail': 'Detalhe da vaga',
  applications: 'Minhas candidaturas',
  profile: 'Meu perfil',
  dashboard: 'Dashboard',
  jobs: 'Minhas vagas',
  'job-create': 'Nova vaga',
  pipeline: 'Pipeline',
  'post-hire': 'Pós-contratação',
  'return-goal': 'Retorno no prazo',
  company: 'Minha empresa',
};

// Titulo da aba do navegador: "<tela> · Job Match" (so "Job Match" na Landing).
export function screenTitle(screen: Screen): string {
  if (screen === 'landing') {
    return APP_NAME;
  }
  return `${SCREEN_TITLES[screen]} · ${APP_NAME}`;
}
