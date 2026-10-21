import { ZodError } from 'zod';
import { PASSWORD_MIN_LENGTH } from './schemas';

// Mensagens de erro de autenticacao em PT-BR, com o proximo passo (N75).
// A tela nunca mostra error.message do Supabase nem do Zod.

// Erro com texto pronto para a tela, lancado pelo proprio app.
export class AuthUserMessageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthUserMessageError';
  }
}

export const AUTH_MESSAGES = {
  invalidCredentials:
    'E-mail ou senha incorretos. Confira os dados e tente de novo, ou use "Esqueci minha senha".',
  emailNotConfirmed:
    'Seu e-mail ainda não foi confirmado. Abra o link que enviamos para a sua caixa de entrada (confira também o spam).',
  userExists:
    'Já existe uma conta com este e-mail. Faça login ou use "Esqueci minha senha".',
  weakPassword: `Senha fraca. Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres, misturando letras e números.`,
  samePassword: 'A nova senha precisa ser diferente da senha atual.',
  rateLimit: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.',
  invalidEmail: 'Este e-mail não é aceito. Confira o endereço ou use outro.',
  signupDisabled: 'Os cadastros estão pausados no momento. Tente de novo mais tarde.',
  userBanned: 'Esta conta está bloqueada. Fale com o suporte do Job Match.',
  sessionExpired: 'Sua sessão expirou. Entre de novo para continuar.',
  invalidData: 'Confira os dados informados e tente de novo.',
  network: 'Sem conexão com o servidor. Verifique sua internet e tente de novo.',
  fields: 'Confira os campos destacados.',
  generic: 'Não foi possível concluir agora. Tente de novo em instantes.',
} as const;

type MessageKey = keyof typeof AUTH_MESSAGES;

// Codigos do Supabase Auth (error.code).
const BY_CODE: Readonly<Record<string, MessageKey>> = {
  invalid_credentials: 'invalidCredentials',
  email_not_confirmed: 'emailNotConfirmed',
  user_already_exists: 'userExists',
  email_exists: 'userExists',
  weak_password: 'weakPassword',
  same_password: 'samePassword',
  over_request_rate_limit: 'rateLimit',
  over_email_send_rate_limit: 'rateLimit',
  over_sms_send_rate_limit: 'rateLimit',
  email_address_invalid: 'invalidEmail',
  email_address_not_authorized: 'invalidEmail',
  signup_disabled: 'signupDisabled',
  email_provider_disabled: 'signupDisabled',
  user_banned: 'userBanned',
  session_not_found: 'sessionExpired',
  session_expired: 'sessionExpired',
  refresh_token_not_found: 'sessionExpired',
  refresh_token_already_used: 'sessionExpired',
  validation_failed: 'invalidData',
};

// Versoes antigas do Supabase so mandam a mensagem em ingles.
const BY_MESSAGE: ReadonlyArray<readonly [RegExp, MessageKey]> = [
  [/invalid login credentials/i, 'invalidCredentials'],
  [/email not confirmed/i, 'emailNotConfirmed'],
  [/already (been )?registered|already exists/i, 'userExists'],
  [/new password should be different/i, 'samePassword'],
  [/password should be|weak password/i, 'weakPassword'],
  [/rate limit|too many requests/i, 'rateLimit'],
  [/failed to fetch|networkerror|network request failed|load failed/i, 'network'],
];

function asRecord(error: unknown): { code?: unknown; message?: unknown; status?: unknown; name?: unknown } {
  return typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthUserMessageError) {
    return error.message;
  }
  if (error instanceof ZodError) {
    return AUTH_MESSAGES.fields;
  }
  const record = asRecord(error);
  if (typeof record.code === 'string' && BY_CODE[record.code]) {
    return AUTH_MESSAGES[BY_CODE[record.code] as MessageKey];
  }
  if (record.status === 429) {
    return AUTH_MESSAGES.rateLimit;
  }
  if (record.name === 'AuthRetryableFetchError') {
    return AUTH_MESSAGES.network;
  }
  const message = typeof record.message === 'string' ? record.message : '';
  for (const [pattern, key] of BY_MESSAGE) {
    if (pattern.test(message)) {
      return AUTH_MESSAGES[key];
    }
  }
  return AUTH_MESSAGES.generic;
}

export const AUTH_FIELDS = ['fullName', 'email', 'password', 'confirmPassword', 'consentAccepted'] as const;
export type AuthField = (typeof AUTH_FIELDS)[number];
export type AuthFieldErrors = Partial<Record<AuthField, string>>;

// Primeira mensagem de cada campo, a partir de error.issues (nunca error.message).
export function authFieldErrors(error: ZodError): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (
      typeof field === 'string' &&
      (AUTH_FIELDS as readonly string[]).includes(field) &&
      !errors[field as AuthField]
    ) {
      errors[field as AuthField] = issue.message;
    }
  }
  return errors;
}
