import type { MatchInsights } from './rejection-reasons';

// Resposta sim/nao como vem do banco, com o requisito embutido (N31).
export interface RequirementAnswerRow {
  meets: boolean;
  job_requirements: { detail: string | null; skills: { name: string } | null } | null;
}

export interface ApplicationRequirementAnswerRow extends RequirementAnswerRow {
  application_id: string;
}

export function requirementLabel(name: string, detail: string | null | undefined): string {
  const trimmed = detail?.trim();
  return trimmed ? `${name} (${trimmed})` : name;
}

// Requisitos que o candidato respondeu que nao atende, em ordem alfabetica.
export function pickUnmetRequirements(rows: RequirementAnswerRow[] | null | undefined): string[] {
  return (rows ?? [])
    .flatMap((row) => {
      const name = row.job_requirements?.skills?.name;
      return !row.meets && name ? [requirementLabel(name, row.job_requirements?.detail)] : [];
    })
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// Junta os requisitos nao atendidos as lacunas de cada candidatura.
export function withUnmetRequirements(
  insights: Record<string, MatchInsights>,
  rows: ApplicationRequirementAnswerRow[],
): Record<string, MatchInsights> {
  const byApplication = new Map<string, RequirementAnswerRow[]>();
  for (const row of rows) {
    const current = byApplication.get(row.application_id) ?? [];
    current.push(row);
    byApplication.set(row.application_id, current);
  }

  const result: Record<string, MatchInsights> = {};
  for (const [applicationId, item] of Object.entries(insights)) {
    const unmet = pickUnmetRequirements(byApplication.get(applicationId));
    result[applicationId] = unmet.length > 0 ? { ...item, unmetRequirements: unmet } : item;
  }
  return result;
}
