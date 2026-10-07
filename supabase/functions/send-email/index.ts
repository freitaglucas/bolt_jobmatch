// Edge function send-email (N17): envia e-mail transacional pelo Resend.
// Deploy: npx supabase functions deploy send-email --no-verify-jwt --use-api
// A verificacao do usuario e feita aqui dentro (auth.getUser), por isso o
// gateway fica sem verify_jwt. Veja o README desta pasta.
import { createClient } from 'npm:@supabase/supabase-js@2';
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

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
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

  // 3) Template permitido. Por enquanto so "test", enviado ao proprio recrutador.
  let body: { template?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'invalid_body' });
  }
  if (!isTemplateName(body.template)) {
    return reply(400, { error: 'unknown_template' });
  }
  const template = body.template;

  const recipient = user.email;
  if (!isValidEmail(recipient)) {
    return reply(400, { error: 'invalid_recipient' });
  }

  // 4) Limite por hora.
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count, error: countError } = await admin
    .from('email_log')
    .select('id', { count: 'exact', head: true })
    .eq('recruiter_id', user.id)
    .gte('created_at', since);
  if (countError) {
    return reply(500, { error: 'lookup_failed' });
  }
  if (isRateLimited(count ?? 0)) {
    return reply(429, { error: 'rate_limited' });
  }

  // 5) Envia e registra.
  const email = renderTemplate(template, {
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
