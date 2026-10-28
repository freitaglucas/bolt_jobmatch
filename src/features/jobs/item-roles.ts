// Papel do item na vaga (N31). Precisa ser igual ao check job_skills_role_check.
// Ate a formula v2 (N32), o score usa mandatory (= obrigatorio) e o implicito
// pontua como desejavel.
export const JOB_ITEM_ROLES = ['required', 'preferred', 'implicit'] as const;

export type JobItemRole = (typeof JOB_ITEM_ROLES)[number];

export const DEFAULT_JOB_ITEM_ROLE: JobItemRole = 'preferred';

export const JOB_ITEM_ROLE_LABELS: Record<JobItemRole, string> = {
  required: 'Obrigatório',
  preferred: 'Desejável',
  implicit: 'Implícito',
};

export const JOB_ITEM_ROLE_HINTS: Record<JobItemRole, string> = {
  required: 'Sem este item o candidato não serve para a vaga.',
  preferred: 'Conta a favor, mas a vaga não depende dele.',
  implicit: 'Não está escrito no anúncio, mas quem faz a função costuma ter.',
};

export function isJobItemRole(value: unknown): value is JobItemRole {
  return typeof value === 'string' && (JOB_ITEM_ROLES as readonly string[]).includes(value);
}

export function roleFromMandatory(mandatory: boolean): JobItemRole {
  return mandatory ? 'required' : DEFAULT_JOB_ITEM_ROLE;
}

export function isMandatoryRole(role: JobItemRole): boolean {
  return role === 'required';
}