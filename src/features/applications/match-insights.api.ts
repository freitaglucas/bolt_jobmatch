import { supabase } from '../../shared/lib/supabase';
import { buildInsightsByApplication, type InsightsSourceRows } from './match-insights';
import type { MatchInsights } from './rejection-reasons';
import { withUnmetRequirements, type ApplicationRequirementAnswerRow } from './requirement-status';

// Quantos ids vao em cada consulta (a lista vai na URL).
const IN_CHUNK = 50;

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

async function inChunks<Row>(
  ids: readonly string[],
  run: (chunk: string[]) => PromiseLike<{ data: Row[] | null; error: Error | null }>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let index = 0; index < ids.length; index += IN_CHUNK) {
    const { data, error } = await run(ids.slice(index, index + IN_CHUNK));
    if (error) {
      throw error;
    }
    rows.push(...(data ?? []));
  }
  return rows;
}

// Le o necessario para sugerir o motivo de cada candidatura. O RLS ja limita as
// vagas do recrutador e libera as competencias de quem se candidatou.
export async function loadMatchInsights(
  applicationIds: readonly string[],
): Promise<Record<string, MatchInsights>> {
  const applications = await inChunks<InsightsSourceRows['applications'][number]>(
    unique(applicationIds),
    (ids) =>
      supabase.from('applications').select('id, job_id, candidate_id').in('id', ids),
  );
  if (applications.length === 0) {
    return {};
  }

  const jobSkills = await inChunks<InsightsSourceRows['jobSkills'][number]>(
    unique(applications.map((application) => application.job_id)),
    (ids) =>
      supabase
        .from('job_skills')
        .select('job_id, skill_id, required_level, weight, mandatory')
        .in('job_id', ids),
  );
  const candidateSkills = await inChunks<InsightsSourceRows['candidateSkills'][number]>(
    unique(applications.map((application) => application.candidate_id)),
    (ids) =>
      supabase
        .from('candidate_skills')
        .select('candidate_id, skill_id, declared_level')
        .in('candidate_id', ids),
  );
  const skills = await inChunks<InsightsSourceRows['skills'][number]>(
    unique([
      ...jobSkills.map((row) => row.skill_id),
      ...candidateSkills.map((row) => row.skill_id),
    ]),
    (ids) => supabase.from('skills').select('id, name').in('id', ids),
  );

  // Requisitos sim/nao respondidos com nao (N31): sugerem o motivo eliminatorio.
  const unmetAnswers = await inChunks<ApplicationRequirementAnswerRow>(
    unique(applications.map((application) => application.id)),
    (ids) =>
      supabase
        .from('application_requirement_answers')
        .select('application_id, meets, job_requirements(detail, skills(name))')
        .eq('meets', false)
        .in('application_id', ids) as unknown as PromiseLike<{
        data: ApplicationRequirementAnswerRow[] | null;
        error: Error | null;
      }>,
  );

  return withUnmetRequirements(
    buildInsightsByApplication({ applications, jobSkills, candidateSkills, skills }),
    unmetAnswers,
  );
}
