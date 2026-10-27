// Prazo padrao de retorno por etapa (SLA). Mesmo valor de public.feedback_sla()
// no banco e de SLA_HOURS em supabase/functions/_shared/email-layout.ts.
export const SLA_HOURS = 120;

export const SLA_DAYS = SLA_HOURS / 24;
