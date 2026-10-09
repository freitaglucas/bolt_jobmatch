// Edge function send-email: envia e-mail transacional pelo Resend.
//  - template "test" (N17): e-mail de teste ao proprio recrutador.
//  - template "batch_feedback" (N15a): retorno em lote ao candidato (gratis, sem token).
// Deploy: npx supabase functions deploy send-email --no-verify-jwt --use-api --project-ref <ref>
// A verificacao do usuario e feita aqui dentro (auth.getUser), por isso o
// gateway fica sem verify_jwt. Veja o README desta pasta.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  type BatchDeps,
  type ApplicationInfo,
  MAX_BATCH_EMAILS_PER_HOUR,
  parseBatchItems,
  processBatch,
} from '../_shared/batch-feedback.ts';
import {
  buildResendPayload,
  isRateLimited,
  isTemplateName,
  isValidEmail,
  renderTemplate,
  sendWithResend,
} from '../_shared/email-core.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_FROM = 'Job Match <onboarding@resend.dev>';
const PAUSE_BETWEEN_SENDS_MS = 250;

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return reply(405, { error: 'method_not_allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') ?? DEFAULT_FROM;

  if (!supabaseUrl || !anonKey || !serviceKey || !resendKey) {
    return reply(500, { error: 'not_configured' });
  }

  // 1) Quem chama: precisa ser um usuario autenticado.
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return reply(401, { error: 'unauthorized' });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) {
    return reply(401, { error: 'unauthorized' });
  }
  const user = userData.user;

  // 2) Somente recrutador aprovado envia e-mail.
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: recruiter, error: recruiterError } = await admin
    .from('recruiter_profiles')
    .select('user_id, approved_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (recruiterError) {
    return reply(500, { error: 'lookup_failed' });
  }
  if (!recruiter || !recruiter.approved_at) {
    return reply(403, { error: 'not_approved' });
  }

  // 3) Template permitido.
  let body: { template?: unknown; items?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'invalid_body' });
  }
  if (!isTemplateName(body.template)) {
    return reply(400, { error: 'unknown_template' });
  }
  const template = body.template;
  const since = new Date(Date.now() - 3_600_000).toISOString();

  // ---------- Retorno em lote ao candidato (N15a) ----------
  if (template === 'batch_feedback') {
    const parsed = parseBatchItems(body.items);
    if (!parsed.ok) {
      return reply(400, { error: parsed.error });
    }

    const { count: batchCount, error: batchCountError } = await admin
      .from('email_log')
      .select('id', { count: 'exact', head: true })
      .eq('recruiter_id', user.id)
      .eq('template', 'batch_feedback')
      .gte('created_at', since);
    if (batchCountError) {
      return reply(500, { error: 'lookup_failed' });
    }

    const deps: BatchDeps = {
      async loadApplication(applicationId, recruiterId): Promise<ApplicationInfo | null> {
        const { data, error } = await admin
          .from('applications')
          .select('id, current_stage, candidate_id, jobs!inner(title, recruiter_id, companies(name))')
          .eq('id', applicationId)
          .eq('jobs.recruiter_id', recruiterId)
          .maybeSingle();
        if (error) {
          throw new Error(`lookup_failed: ${error.message}`);
        }
        if (!data) {
          return null;
        }
        const job = one(data.jobs as unknown) as {
          title?: string;
          companies?: { name?: string } | { name?: string }[] | null;
        } | null;
        return {
          id: data.id as string,
          stage: data.current_stage as string,
          candidateId: data.candidate_id as string,
          jobTitle: job?.title ?? '',
          companyName: one(job?.companies)?.name ?? null,
        };
      },

      async getCandidateEmail(candidateId) {
        const { data, error } = await admin.auth.admin.getUserById(candidateId);
        if (error) {
          return null;
        }
        return data.user?.email ?? null;
      },

      async claimLog(entry) {
        const { data, error } = await admin
          .from('email_log')
          .insert({
            recruiter_id: entry.recruiterId,
            template: 'batch_feedback',
            to_email: entry.toEmail,
            status: 'pending',
            application_id: entry.applicationId,
            stage: entry.stage,
            feedback_kind: entry.kind,
          })
          .select('id')
          .single();
        if (error) {
          if (error.code === '23505') {
            return 'duplicate';
          }
          throw new Error(`log_failed: ${error.message}`);
        }
        return { id: data.id as string };
      },

      async recordDecision({ applicationId, message, reasonCode }) {
        // Nova tentativa depois de falha so no e-mail: nao duplica o retorno no app.
        const { data: existing } = await admin
          .from('feedbacks')
          .select('id')
          .eq('application_id', applicationId)
          .eq('kind', 'decision')
          .eq('content', message)
          .limit(1);
        if (existing && existing.length > 0) {
          return;
        }
        const sentAt = new Date().toISOString();
        const { error } = await admin.from('feedbacks').insert({
          application_id: applicationId,
          author_id: user.id,
          content: message,
          kind: 'decision',
          reason_code: reasonCode,
          sent_to_candidate_at: sentAt,
        });
        if (error) {
          throw new Error(error.message);
        }
        await admin.from('applications').update({ feedback_sent_at: sentAt }).eq('id', applicationId);
      },

      async recordUpdate({ applicationId, message, newDueAt }) {
        // postpone_feedback usa auth.uid(): chamada com o token do recrutador, nao com a chave de servico.
        const { error } = await userClient.rpc('postpone_feedback', {
          _application_id: applicationId,
          _new_due_at: newDueAt,
          _message: message,
        });
        if (error) {
          throw new Error(error.message);
        }
      },

      send: (payload) => sendWithResend(fetch, resendKey, payload),

      async finishLog(id, result) {
        await admin
          .from('email_log')
          .update(
            result.status === 'sent'
              ? { status: 'sent', provider_id: result.providerId }
              : { status: 'failed', error: result.error.slice(0, 500) },
          )
          .eq('id', id);
      },

      pause: () => new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_SENDS_MS)),
    };

    const summary = await processBatch(
      deps,
      {
        recruiterId: user.id,
        recruiterEmail: user.email ?? null,
        from,
        quota: Math.max(0, MAX_BATCH_EMAILS_PER_HOUR - (batchCount ?? 0)),
      },
      parsed.items,
      parsed.rejected,
    );
    return reply(200, summary as unknown as Record<string, unknown>);
  }

  // ---------- E-mail de teste (N17), enviado ao proprio recrutador ----------
  const recipient = user.email;
  if (!isValidEmail(recipient)) {
    return reply(400, { error: 'invalid_recipient' });
  }

  // 4) Limite por hora (so do teste).
  const { count, error: countError } = await admin
    .from('email_log')
    .select('id', { count: 'exact', head: true })
    .eq('recruiter_id', user.id)
    .eq('template', 'test')
    .gte('created_at', since);
  if (countError) {
    return reply(500, { error: 'lookup_failed' });
  }
  if (isRateLimited(count ?? 0)) {
    return reply(429, { error: 'rate_limited' });
  }

  // 5) Envia e registra.
  const email = renderTemplate('test', {
    recipientName: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined,
  });
  const payload = buildResendPayload(from, recipient, email);

  try {
    const result = await sendWithResend(fetch, resendKey, payload);
    await admin.from('email_log').insert({
      recruiter_id: user.id,
      template,
      to_email: recipient,
      status: 'sent',
      provider_id: result.id,
    });
    return reply(200, { ok: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    await admin.from('email_log').insert({
      recruiter_id: user.id,
      template,
      to_email: recipient,
      status: 'failed',
      error: message.slice(0, 500),
    });
    return reply(502, { error: 'send_failed' });
  }
});