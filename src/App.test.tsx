// @vitest-environment jsdom
// N59: teste de renderizacao do App. Confere que cada gate esta montado para o
// papel certo (o N56 quebrou duas vezes porque nada testava isso). As telas
// sao trocadas por marcadores; os gates e os hooks deles rodam de verdade, com
// as funcoes de api.ts simuladas.
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@/features/auth/types';
import type { CandidateProfile } from '@/features/candidates/types';
import type { RecruiterOnboardingProfile } from '@/features/recruiters/types';

// jsdom não expõe localStorage no Node 22+ (o global do Node volta undefined);
// polyfill em memória para os hooks de origem/funil e para o clear do beforeEach.
if (typeof window !== 'undefined' && !window.localStorage) {
  const memory = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return memory.size;
      },
      clear: () => memory.clear(),
      getItem: (key: string) => memory.get(key) ?? null,
      key: (index: number) => Array.from(memory.keys())[index] ?? null,
      removeItem: (key: string) => {
        memory.delete(key);
      },
      setItem: (key: string, value: string) => {
        memory.set(key, String(value));
      },
    },
  });
}

const mocks = vi.hoisted(() => ({
  user: null as AuthUser | null,
  hasTcle: vi.fn<(userId: string) => Promise<boolean>>(),
  candidateProfile: vi.fn<() => Promise<CandidateProfile>>(),
  recruiterProfile: vi.fn<() => Promise<RecruiterOnboardingProfile>>(),
}));

vi.mock('@/shared/lib/supabase', () => ({ supabase: {} }));

vi.mock('@/features/auth/hooks', () => ({
  useAuth: () => ({ user: mocks.user, isLoading: false, signOut: vi.fn() }),
}));

vi.mock('@/features/consents/api', () => ({
  hasTcleConsent: mocks.hasTcle,
  acceptTcleConsent: vi.fn(),
  recordConsent: vi.fn(),
}));

vi.mock('@/features/candidates/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/candidates/api')>()),
  getMyCandidateProfile: mocks.candidateProfile,
  saveMyCandidateProfile: vi.fn(),
  getSkillCatalog: vi.fn(async () => []),
}));

vi.mock('@/features/recruiters/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/recruiters/api')>()),
  getRecruiterOnboarding: mocks.recruiterProfile,
  saveRecruiterOnboarding: vi.fn(),
}));

vi.mock('@/features/telemetry/api', () => ({
  trackJobViewed: vi.fn(async () => undefined),
  trackProfileStarted: vi.fn(async () => undefined),
  trackProfileCompleted: vi.fn(async () => undefined),
  trackApplicationSubmitted: vi.fn(async () => undefined),
}));

vi.mock('@/screens/Landing', () => ({ Landing: () => <p>tela-landing</p> }));
vi.mock('@/screens/Auth', () => ({ Auth: () => <p>tela-auth</p> }));
vi.mock('@/screens/ResetPassword', () => ({ ResetPassword: () => <p>tela-reset</p> }));
vi.mock('@/screens/Swipe', () => ({ Swipe: () => <p>tela-vagas</p> }));
vi.mock('@/screens/JobDetail', () => ({ JobDetail: () => <p>tela-detalhe</p> }));
vi.mock('@/screens/Applications', () => ({ Applications: () => <p>tela-candidaturas</p> }));
vi.mock('@/screens/Profile', () => ({ Profile: () => <p>tela-perfil</p> }));
vi.mock('@/screens/Dashboard', () => ({ Dashboard: () => <p>tela-dashboard</p> }));
vi.mock('@/screens/RecruiterJobs', () => ({ RecruiterJobs: () => <p>tela-vagas-recrutador</p> }));
vi.mock('@/screens/JobCreate', () => ({ JobCreate: () => <p>tela-nova-vaga</p> }));
vi.mock('@/screens/Pipeline', () => ({ Pipeline: () => <p>tela-pipeline</p> }));
vi.mock('@/screens/PostHire', () => ({ PostHire: () => <p>tela-pos-contratacao</p> }));
vi.mock('@/screens/ReturnGoal', () => ({ ReturnGoal: () => <p>tela-retorno</p> }));
vi.mock('@/screens/Company', () => ({ Company: () => <p>tela-empresa</p> }));

import App from './App';

const CANDIDATE = {
  id: 'c1000000-0000-0000-0000-000000000001',
  email: 'candidata@test.local',
  role: 'candidate',
} as unknown as AuthUser;

const RECRUITER = {
  id: 'r1000000-0000-0000-0000-000000000001',
  email: 'recrutadora@test.local',
  role: 'recruiter',
} as unknown as AuthUser;

const COMPLETE_PROFILE: CandidateProfile = {
  fullName: 'Ana Teste',
  currentPosition: 'Analista',
  location: 'São Paulo, SP',
  phone: '',
  bio: '',
  desiredPositions: [],
  yearsOfExperience: 3,
  seniorityGeneral: 'Pleno',
  acceptedContractTypes: [],
  acceptedWorkModels: [],
  willingToRelocate: false,
  salaryExpectation: null,
  skills: [
    { skillId: 's1', name: 'Excel', category: 'hard', declaredLevel: 3, evidencedByProject: false },
    { skillId: 's2', name: 'SQL', category: 'hard', declaredLevel: 3, evidencedByProject: false },
    { skillId: 's3', name: 'Comunicação', category: 'soft', declaredLevel: 3, evidencedByProject: false },
  ],
};

const EMPTY_PROFILE: CandidateProfile = {
  ...COMPLETE_PROFILE,
  fullName: '',
  location: '',
  skills: [],
};

function recruiter(overrides: Partial<RecruiterOnboardingProfile>): RecruiterOnboardingProfile {
  return {
    companyId: 'co100000-0000-0000-0000-000000000001',
    companyName: 'Acme',
    position: 'Recrutadora',
    phone: '',
    approvedAt: '2026-10-01T12:00:00Z',
    ...overrides,
  };
}

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<App />, { wrapper });
}

beforeEach(() => {
  mocks.user = null;
  mocks.hasTcle.mockReset().mockResolvedValue(true);
  mocks.candidateProfile.mockReset().mockResolvedValue(COMPLETE_PROFILE);
  mocks.recruiterProfile.mockReset().mockResolvedValue(recruiter({}));
  window.history.replaceState(null, '', '/');
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('App sem sessão', () => {
  it('mostra a Landing', async () => {
    renderApp();
    expect(await screen.findByText('tela-landing')).toBeTruthy();
  });
});

describe('gate do TCLE', () => {
  it('candidato sem aceite vê os termos e não vê o app', async () => {
    mocks.user = CANDIDATE;
    mocks.hasTcle.mockResolvedValue(false);
    renderApp();
    expect(await screen.findByText('Termos de Uso e Política de Privacidade')).toBeTruthy();
    expect(screen.queryByText('tela-vagas')).toBeNull();
  });

  it('recrutador sem aceite vê os termos e não vê o app', async () => {
    mocks.user = RECRUITER;
    mocks.hasTcle.mockResolvedValue(false);
    renderApp();
    expect(await screen.findByText('Termos de Uso e Política de Privacidade')).toBeTruthy();
    expect(screen.queryByText('tela-dashboard')).toBeNull();
  });
});

describe('gate do candidato', () => {
  it('perfil incompleto mostra o formulário do candidato', async () => {
    mocks.user = CANDIDATE;
    mocks.candidateProfile.mockResolvedValue(EMPTY_PROFILE);
    renderApp();
    expect(await screen.findByLabelText('Nome')).toBeTruthy();
    expect(screen.queryByText('tela-vagas')).toBeNull();
    expect(mocks.recruiterProfile).not.toHaveBeenCalled();
  });

  it('perfil completo abre o app do candidato', async () => {
    mocks.user = CANDIDATE;
    renderApp();
    expect(await screen.findByText('tela-vagas')).toBeTruthy();
    expect(screen.getAllByText('Candidaturas').length).toBeGreaterThan(0);
    expect(screen.queryByText('Retorno no prazo')).toBeNull();
    expect(mocks.recruiterProfile).not.toHaveBeenCalled();
  });

  it('erro ao carregar o perfil mostra tentar de novo e sair', async () => {
    mocks.user = CANDIDATE;
    mocks.candidateProfile.mockRejectedValue(new Error('falha'));
    renderApp();
    expect(await screen.findByText('Não foi possível carregar seu perfil.')).toBeTruthy();
    expect(screen.getAllByText('Sair').length).toBeGreaterThan(0);
  });
});

describe('gate do recrutador', () => {
  it('sem cadastro mostra o formulário do recrutador', async () => {
    mocks.user = RECRUITER;
    mocks.recruiterProfile.mockResolvedValue(
      recruiter({ companyId: null, companyName: null, position: '', approvedAt: null }),
    );
    renderApp();
    expect(await screen.findByText('Conte um pouco sobre você e sua empresa')).toBeTruthy();
    expect(screen.queryByText('tela-dashboard')).toBeNull();
    expect(mocks.candidateProfile).not.toHaveBeenCalled();
  });

  it('cadastro enviado e não aprovado mostra a espera da aprovação', async () => {
    mocks.user = RECRUITER;
    mocks.recruiterProfile.mockResolvedValue(recruiter({ approvedAt: null }));
    renderApp();
    expect(await screen.findByText('Cadastro recebido!')).toBeTruthy();
    expect(screen.getByText('Verificar aprovação')).toBeTruthy();
    expect(screen.queryByText('tela-dashboard')).toBeNull();
  });

  it('aprovado sem empresa pede só a empresa (regressão do N56)', async () => {
    mocks.user = RECRUITER;
    mocks.recruiterProfile.mockResolvedValue(recruiter({ companyId: null, companyName: null }));
    renderApp();
    expect(await screen.findByText('Falta só a sua empresa')).toBeTruthy();
    expect(screen.queryByText('tela-dashboard')).toBeNull();
  });

  it('aprovado com empresa abre o app do recrutador', async () => {
    mocks.user = RECRUITER;
    renderApp();
    expect(await screen.findByText('tela-dashboard')).toBeTruthy();
    expect(screen.getAllByText('Retorno no prazo').length).toBeGreaterThan(0);
    expect(mocks.candidateProfile).not.toHaveBeenCalled();
  });

  it('erro ao carregar o cadastro mostra tentar de novo e sair', async () => {
    mocks.user = RECRUITER;
    mocks.recruiterProfile.mockRejectedValue(new Error('falha'));
    renderApp();
    expect(
      await screen.findByText('Não foi possível carregar seus dados de recrutador.'),
    ).toBeTruthy();
    expect(screen.getAllByText('Sair').length).toBeGreaterThan(0);
  });
});
