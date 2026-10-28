import { supabase } from '../../shared/lib/supabase';
import { SCORED_KINDS } from './item-kinds';

export interface SkillOption {
  id: string;
  name: string;
  category: string;
}

export async function listSkills(): Promise<SkillOption[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, category')
    .in('kind', [...SCORED_KINDS])
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
  }));
}
