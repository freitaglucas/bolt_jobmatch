export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_range: string;
  employment_type: 'CLT' | 'PJ' | 'Híbrido';
  description: string;
  status: 'Rascunho' | 'Ativa' | 'Pausada' | 'Fechada';
  created_at: string;
}

export interface JobSkill {
  id: string;
  job_id: string;
  skill_name: string;
  required_level: number;
  weight: number;
  mandatory: boolean;
  // Grupo de alternativas (N33): o candidato precisa de group_min itens do grupo.
  group_id?: string | null;
  group_min?: number;
}
