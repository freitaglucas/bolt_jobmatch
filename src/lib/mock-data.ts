import type {
  Job,
  Application,
  CandidateProfile,
  PipelineCandidate,
  TokenEvent,
} from './types';

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Supervisor de Inovação',
    company: 'SENAI',
    location: 'São Paulo, SP',
    salary: 'R$ 8.000 - 12.000',
    type: 'CLT',
    description:
      'Liderará iniciativas de inovação na instituição, gerenciando portfólio de projetos e conexões com startups. Responsável por identificar oportunidades de inovação aberta e aplicar metodologias ágeis em processos internos.',
    matchScore: 65,
    posted: '2 dias atrás',
    tags: ['Inovação', 'Gestão de Projetos', 'Startups'],
    status: 'Ativa',
    candidatesCount: 14,
    newCandidatesCount: 3,
    interviewCount: 2,
    skills: [
      { name: 'Gestão de Projetos', level: 4, candidateLevel: 4, mandatory: true },
      { name: 'Inovação Aberta', level: 4, candidateLevel: 3, mandatory: true },
      { name: 'Metodologias Ágeis', level: 3, candidateLevel: 4, mandatory: false },
      { name: 'Negociação', level: 4, candidateLevel: 2, mandatory: true },
      { name: 'Design Thinking', level: 3, candidateLevel: 0, mandatory: false },
      { name: 'Liderança', level: 4, candidateLevel: 3, mandatory: true },
    ],
  },
  {
    id: 'job-2',
    title: 'Analista de Inovação Aberta',
    company: 'TechHub Brasil',
    location: 'Remoto',
    salary: 'R$ 6.000 - 9.000',
    type: 'Híbrido',
    description:
      'Conectará a empresa ao ecossistema de startups, mapeando tecnologias emergentes e estruturando programas de aceleração. Ideal para quem ama relacionamento e tecnologia.',
    matchScore: 92,
    posted: '1 dia atrás',
    tags: ['Inovação', 'Startups', 'Ecossistema'],
    status: 'Ativa',
    candidatesCount: 22,
    newCandidatesCount: 5,
    interviewCount: 3,
    skills: [
      { name: 'Inovação Aberta', level: 4, candidateLevel: 4, mandatory: true },
      { name: 'Gestão de Projetos', level: 4, candidateLevel: 4, mandatory: true },
      { name: 'Negociação', level: 3, candidateLevel: 4, mandatory: true },
      { name: 'Metodologias Ágeis', level: 3, candidateLevel: 4, mandatory: false },
      { name: 'Liderança', level: 3, candidateLevel: 3, mandatory: false },
      { name: 'Design Thinking', level: 3, candidateLevel: 3, mandatory: false },
    ],
  },
  {
    id: 'job-3',
    title: 'Desenvolvedor Backend',
    company: 'CodeForge',
    location: 'Curitiba, PR',
    salary: 'R$ 5.000 - 8.000',
    type: 'CLT',
    description:
      'Desenvolvimento de APIs REST, microsserviços e infraestrutura cloud. Stack: Node.js, PostgreSQL, AWS. Experiência com CI/CD é diferencial.',
    matchScore: 18,
    posted: '5 dias atrás',
    tags: ['Node.js', 'PostgreSQL', 'AWS'],
    status: 'Ativa',
    candidatesCount: 8,
    newCandidatesCount: 1,
    interviewCount: 0,
    skills: [
      { name: 'Node.js', level: 4, candidateLevel: 0, mandatory: true },
      { name: 'PostgreSQL', level: 4, candidateLevel: 0, mandatory: true },
      { name: 'AWS', level: 3, candidateLevel: 0, mandatory: false },
      { name: 'CI/CD', level: 3, candidateLevel: 0, mandatory: false },
      { name: 'Metodologias Ágeis', level: 3, candidateLevel: 4, mandatory: false },
      { name: 'Git', level: 3, candidateLevel: 2, mandatory: true },
    ],
  },
  {
    id: 'job-4',
    title: 'Gestor de Parcerias Estratégicas',
    company: 'ConnectaLab',
    location: 'Belo Horizonte, MG',
    salary: 'R$ 7.000 - 10.000',
    type: 'Híbrido',
    description:
      'Responsável por estruturar e gerenciar parcerias estratégicas com universidades, startups e centros de pesquisa. Foco em gerar impacto mensurável.',
    matchScore: 78,
    posted: '3 dias atrás',
    tags: ['Parcerias', 'Estratégia', 'Relacionamento'],
    status: 'Ativa',
    candidatesCount: 11,
    newCandidatesCount: 2,
    interviewCount: 1,
    skills: [
      { name: 'Negociação', level: 4, candidateLevel: 4, mandatory: true },
      { name: 'Inovação Aberta', level: 3, candidateLevel: 3, mandatory: true },
      { name: 'Gestão de Projetos', level: 4, candidateLevel: 4, mandatory: true },
      { name: 'Liderança', level: 3, candidateLevel: 3, mandatory: false },
      { name: 'Design Thinking', level: 2, candidateLevel: 3, mandatory: false },
    ],
  },
];

export const mockRecruiterJobs: Job[] = [
  ...mockJobs,
  {
    id: 'job-5',
    title: 'Coordenador de Projetos de Inovação',
    company: 'SENAI',
    location: 'São Paulo, SP',
    salary: 'R$ 9.000 - 14.000',
    type: 'CLT',
    description: 'Coordenar portfólio de projetos de inovação, garantindo entregas no prazo e alinhamento estratégico.',
    matchScore: 0,
    posted: '7 dias atrás',
    tags: ['Gestão de Projetos', 'Inovação', 'Coordenação'],
    status: 'Pausada',
    candidatesCount: 6,
    newCandidatesCount: 0,
    interviewCount: 1,
    skills: [
      { name: 'Gestão de Projetos', level: 4, candidateLevel: 0, mandatory: true },
      { name: 'Liderança', level: 4, candidateLevel: 0, mandatory: true },
      { name: 'Metodologias Ágeis', level: 3, candidateLevel: 0, mandatory: false },
    ],
  },
  {
    id: 'job-6',
    title: 'Analista de Ecossistema',
    company: 'TechHub Brasil',
    location: 'Remoto',
    salary: 'R$ 4.500 - 7.000',
    type: 'Híbrido',
    description: 'Mapear e analisar o ecossistema de startups, produzindo relatórios e insights para a equipe de inovação.',
    matchScore: 0,
    posted: '10 dias atrás',
    tags: ['Ecossistema', 'Análise', 'Startups'],
    status: 'Rascunho',
    candidatesCount: 0,
    newCandidatesCount: 0,
    interviewCount: 0,
    skills: [
      { name: 'Inovação Aberta', level: 3, candidateLevel: 0, mandatory: true },
      { name: 'Análise de Dados', level: 3, candidateLevel: 0, mandatory: false },
    ],
  },
];

export const mockJobCandidates: Record<string, PipelineCandidate[]> = {
  'job-1': [
    { id: 'jc1-1', name: 'Carla Mendes', role: 'Analista de Inovação', seniority: 'Pleno', matchScore: 78, appliedDate: '22 Set', stage: 'Triagem', avatarColor: 'bg-jm-orange' },
    { id: 'jc1-2', name: 'Diego Ferreira', role: 'Consultor de Inovação', seniority: 'Especialista', matchScore: 88, appliedDate: '23 Set', stage: 'Triagem', avatarColor: 'bg-jm-purple' },
    { id: 'jc1-3', name: 'Elena Rocha', role: 'Coordenadora de Projetos', seniority: 'Senior', matchScore: 71, appliedDate: '24 Set', stage: 'Em análise', avatarColor: 'bg-jm-teal' },
  ],
  'job-2': [
    { id: 'jc2-1', name: 'Ana Silva', role: 'Analista de Parcerias', seniority: 'Pleno', matchScore: 92, appliedDate: '20 Set', stage: 'Entrevista', avatarColor: 'bg-jm-purple' },
    { id: 'jc2-2', name: 'Bruno Costa', role: 'Gestor de Projetos', seniority: 'Senior', matchScore: 85, appliedDate: '21 Set', stage: 'Entrevista', avatarColor: 'bg-jm-teal' },
    { id: 'jc2-3', name: 'Felipe Alves', role: 'Analista de Parcerias', seniority: 'Junior', matchScore: 55, appliedDate: '25 Set', stage: 'Em análise', avatarColor: 'bg-jm-orange' },
    { id: 'jc2-4', name: 'Gabriela Nunes', role: 'Head de Inovação', seniority: 'Especialista', matchScore: 95, appliedDate: '26 Set', stage: 'Final', avatarColor: 'bg-jm-purple' },
  ],
  'job-3': [
    { id: 'jc3-1', name: 'Henrique Dias', role: 'Desenvolvedor Full-stack', seniority: 'Senior', matchScore: 62, appliedDate: '25 Set', stage: 'Em análise', avatarColor: 'bg-jm-teal' },
  ],
  'job-4': [
    { id: 'jc4-1', name: 'Ana Silva', role: 'Analista de Parcerias', seniority: 'Pleno', matchScore: 78, appliedDate: '27 Set', stage: 'Em análise', avatarColor: 'bg-jm-purple' },
    { id: 'jc4-2', name: 'Bruno Costa', role: 'Gestor de Projetos', seniority: 'Senior', matchScore: 81, appliedDate: '26 Set', stage: 'Triagem', avatarColor: 'bg-jm-teal' },
  ],
  'job-5': [],
  'job-6': [],
};

export const mockApplications: Application[] = [
  {
    id: 'app-1',
    jobId: 'job-2',
    jobTitle: 'Analista de Inovação Aberta',
    company: 'TechHub Brasil',
    status: 'Entrevista',
    appliedDate: '2026-09-20',
    matchScore: 92,
    feedback: 'Candidata com excelente fit técnico. Agendar entrevista com gestora.',
    timeline: [
      { label: 'Candidatura enviada', date: '20 Set', done: true, status: 'Em análise' },
      { label: 'Triagem de currículo', date: '22 Set', done: true, status: 'Triagem' },
      { label: 'Entrevista agendada', date: '26 Set', done: true, status: 'Entrevista' },
      { label: 'Entrevista com gestora', date: '30 Set', done: false, status: 'Entrevista' },
      { label: 'Decisão final', date: 'Pendente', done: false, status: 'Final' },
    ],
  },
  {
    id: 'app-2',
    jobId: 'job-1',
    jobTitle: 'Supervisor de Inovação',
    company: 'SENAI',
    status: 'Triagem',
    appliedDate: '2026-09-25',
    matchScore: 65,
    timeline: [
      { label: 'Candidatura enviada', date: '25 Set', done: true, status: 'Em análise' },
      { label: 'Triagem de currículo', date: '27 Set', done: true, status: 'Triagem' },
      { label: 'Entrevista', date: 'Pendente', done: false, status: 'Entrevista' },
      { label: 'Decisão final', date: 'Pendente', done: false, status: 'Final' },
    ],
  },
  {
    id: 'app-3',
    jobId: 'job-4',
    jobTitle: 'Gestor de Parcerias Estratégicas',
    company: 'ConnectaLab',
    status: 'Em análise',
    appliedDate: '2026-09-27',
    matchScore: 78,
    timeline: [
      { label: 'Candidatura enviada', date: '27 Set', done: true, status: 'Em análise' },
      { label: 'Triagem de currículo', date: 'Pendente', done: false, status: 'Triagem' },
      { label: 'Entrevista', date: 'Pendente', done: false, status: 'Entrevista' },
      { label: 'Decisão final', date: 'Pendente', done: false, status: 'Final' },
    ],
  },
];

export const mockCandidate: CandidateProfile = {
  name: 'Ana Silva',
  role: 'Analista de Parcerias',
  seniority: 'Pleno',
  email: 'ana.silva@email.com',
  location: 'São Paulo, SP',
  bio: 'Analista de parcerias com 5 anos de experiência em inovação aberta e gestão de projetos. Apaixonada por conectar empresas a startups e gerar impacto mensurável.',
  skills: [
    { name: 'Inovação Aberta', level: 4 },
    { name: 'Gestão de Projetos', level: 4 },
    { name: 'Negociação', level: 4 },
    { name: 'Metodologias Ágeis', level: 4 },
    { name: 'Liderança', level: 3 },
    { name: 'Design Thinking', level: 3 },
    { name: 'Relacionamento', level: 5 },
    { name: 'Análise de Dados', level: 3 },
    { name: 'Apresentações', level: 4 },
    { name: 'Canvas', level: 3 },
    { name: 'Mapeamento', level: 4 },
    { name: 'Pitch', level: 3 },
    { name: 'Estratégia', level: 4 },
  ],
  projects: [
    {
      title: 'Programa de Aceleração 2025',
      description: 'Estruturei programa de aceleração para 10 startups, gerando R$ 2M em investimento.',
      link: 'linkedin.com/ana-silva/aceleracao',
    },
    {
      title: 'Hackathon InovaSENAI',
      description: 'Organizei hackathon com 200+ participantes e 15 projetos desenvolvidos em 48h.',
      link: 'linkedin.com/ana-silva/hackathon',
    },
    {
      title: 'Mapeamento de Ecossistema',
      description: 'Mapeei 150+ startups do ecossistema nacional de inovação aberta.',
      link: 'linkedin.com/ana-silma/mapeamento',
    },
  ],
  links: [
    { label: 'LinkedIn', url: 'linkedin.com/in/ana-silva' },
    { label: 'Portfólio', url: 'anasilva.dev' },
    { label: 'GitHub', url: 'github.com/anasilva' },
  ],
};

export const mockPipelineCandidates: PipelineCandidate[] = [
  { id: 'c1', name: 'Ana Silva', role: 'Analista de Parcerias', seniority: 'Pleno', matchScore: 92, appliedDate: '20 Set', stage: 'Entrevista', avatarColor: 'bg-jm-purple' },
  { id: 'c2', name: 'Bruno Costa', role: 'Gestor de Projetos', seniority: 'Senior', matchScore: 85, appliedDate: '21 Set', stage: 'Entrevista', avatarColor: 'bg-jm-teal' },
  { id: 'c3', name: 'Carla Mendes', role: 'Analista de Inovação', seniority: 'Pleno', matchScore: 78, appliedDate: '22 Set', stage: 'Triagem', avatarColor: 'bg-jm-orange' },
  { id: 'c4', name: 'Diego Ferreira', role: 'Consultor de Inovação', seniority: 'Especialista', matchScore: 88, appliedDate: '23 Set', stage: 'Triagem', avatarColor: 'bg-jm-purple' },
  { id: 'c5', name: 'Elena Rocha', role: 'Coordenadora de Projetos', seniority: 'Senior', matchScore: 71, appliedDate: '24 Set', stage: 'Em análise', avatarColor: 'bg-jm-teal' },
  { id: 'c6', name: 'Felipe Alves', role: 'Analista de Parcerias', seniority: 'Junior', matchScore: 55, appliedDate: '25 Set', stage: 'Em análise', avatarColor: 'bg-jm-orange' },
  { id: 'c7', name: 'Gabriela Nunes', role: 'Head de Inovação', seniority: 'Especialista', matchScore: 95, appliedDate: '26 Set', stage: 'Final', avatarColor: 'bg-jm-purple' },
  { id: 'c8', name: 'Henrique Dias', role: 'Gestor de Inovação', seniority: 'Senior', matchScore: 82, appliedDate: '27 Set', stage: 'Aprovado', avatarColor: 'bg-jm-teal' },
];

export const mockTokenEvents: TokenEvent[] = [
  { id: 't1', action: 'Candidatura qualificada recebida', amount: 20, date: '27 Set', type: 'earn' },
  { id: 't2', action: 'Match de alta compatibilidade', amount: 15, date: '26 Set', type: 'earn' },
  { id: 't3', action: 'Vaga promovida em destaque', amount: 50, date: '25 Set', type: 'spend' },
  { id: 't4', action: 'Candidatura finalizada com sucesso', amount: 30, date: '24 Set', type: 'earn' },
  { id: 't5', action: 'Acesso a banco de talentos premium', amount: 40, date: '23 Set', type: 'spend' },
];

export const recruiterStats = {
  activeJobs: 12,
  totalApplications: 48,
  newApplications: 8,
  interviews: 5,
  tokenBalance: 340,
};

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-jm-purple';
  if (score >= 60) return 'text-jm-teal';
  if (score >= 40) return 'text-jm-orange';
  return 'text-jm-red';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-jm-purple';
  if (score >= 60) return 'bg-jm-teal';
  if (score >= 40) return 'bg-jm-orange';
  return 'bg-jm-red';
}

export function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-jm-purple';
  if (score >= 60) return 'border-jm-teal';
  if (score >= 40) return 'border-jm-orange';
  return 'border-jm-red';
}

export const pipelineColumns: { stage: string; color: string }[] = [
  { stage: 'Em análise', color: 'bg-slate-500' },
  { stage: 'Triagem', color: 'bg-blue-500' },
  { stage: 'Entrevista', color: 'bg-jm-purple' },
  { stage: 'Final', color: 'bg-jm-orange' },
  { stage: 'Aprovado', color: 'bg-jm-teal' },
];
