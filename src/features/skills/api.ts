import { supabase } from '../../shared/lib/supabase';
import { SCORED_KINDS } from './item-kinds';

export interface SkillOption {
  id: string;
  name: string;
  category: string;
  // Tipo do item (N31): competency ou tool nesta lista.
  kind?: string;
}

export interface RequirementOption {
  id: string;
  name: string;
  // Pergunta sim/nao mostrada ao candidato (skills.description).
  question: string;
}

export async function listSkills(): Promise<SkillOption[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, category, kind')
    .in('kind', [...SCORED_KINDS])
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    kind: row.kind,
  }));
}

// Requisitos sim/nao do catalogo (N31), para a recrutadora escolher na vaga.
export async function listRequirementOptions(): Promise<RequirementOption[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, description')
    .eq('kind', 'requirement')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    question: row.description?.trim() || `A vaga pede: ${row.name}. Você atende?`,
  }));
}
