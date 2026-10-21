import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import {
  AUTH_MESSAGES,
  AuthUserMessageError,
  authErrorMessage,
  authFieldErrors,
} from './errors';
import { SignInSchema, SignUpSchema } from './schemas';

function zodError(schema: typeof SignUpSchema | typeof SignInSchema, value: unknown): ZodError {
  const result = schema.safeParse(value);
  if (result.success) {
    throw new Error('expected a validation error');
  }
  return result.error;
}

describe('authErrorMessage', () => {
  it('maps Supabase codes to PT-BR messages with a next step', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      AUTH_MESSAGES.invalidCredentials,
    );
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toBe(AUTH_MESSAGES.emailNotConfirmed);
    expect(authErrorMessage({ code: 'user_already_exists' })).toBe(AUTH_MESSAGES.userExists);
    expect(authErrorMessage({ code: 'weak_password' })).toBe(AUTH_MESSAGES.weakPassword);
    expect(authErrorMessage({ code: 'over_email_send_rate_limit' })).toBe(AUTH_MESSAGES.rateLimit);
    expect(authErrorMessage({ code: 'same_password' })).toBe(AUTH_MESSAGES.samePassword);
  });

  it('falls back to the English message of older versions', () => {
    expect(authErrorMessage(new Error('Invalid login credentials'))).toBe(AUTH_MESSAGES.invalidCredentials);
    expect(authErrorMessage(new Error('User already registered'))).toBe(AUTH_MESSAGES.userExists);
    expect(authErrorMessage(new Error('Password should be at least 6 characters.'))).toBe(
      AUTH_MESSAGES.weakPassword,
    );
    expect(authErrorMessage(new TypeError('Failed to fetch'))).toBe(AUTH_MESSAGES.network);
    expect(authErrorMessage({ name: 'AuthRetryableFetchError', message: '{}' })).toBe(AUTH_MESSAGES.network);
    expect(authErrorMessage({ status: 429, message: 'x' })).toBe(AUTH_MESSAGES.rateLimit);
  });

  it('never leaks a technical message', () => {
    expect(authErrorMessage(new Error('duplicate key value violates unique constraint'))).toBe(
      AUTH_MESSAGES.generic,
    );
    expect(authErrorMessage('boom')).toBe(AUTH_MESSAGES.generic);
    expect(authErrorMessage(null)).toBe(AUTH_MESSAGES.generic);
    expect(authErrorMessage(zodError(SignInSchema, { email: '', password: '' }))).toBe(AUTH_MESSAGES.fields);
  });

  it('keeps messages the app wrote itself', () => {
    expect(authErrorMessage(new AuthUserMessageError('Mensagem pronta.'))).toBe('Mensagem pronta.');
  });
});

describe('authFieldErrors', () => {
  it('gives one PT-BR message per field from error.issues', () => {
    const errors = authFieldErrors(
      zodError(SignUpSchema, {
        email: 'nao-e-email',
        password: '123',
        confirmPassword: '123',
        fullName: '   ',
        role: 'candidate',
        consentAccepted: true,
      }),
    );
    expect(errors).toEqual({
      email: 'Informe um e-mail válido, como voce@email.com.',
      password: 'A senha precisa ter no mínimo 6 caracteres.',
      fullName: 'Informe seu nome completo.',
    });
  });

  it('points the confirmation mismatch to its own field', () => {
    const errors = authFieldErrors(
      zodError(SignUpSchema, {
        email: 'a@b.co',
        password: 'senha123',
        confirmPassword: 'senha124',
        fullName: 'Ana',
        role: 'candidate',
        consentAccepted: true,
      }),
    );
    expect(errors).toEqual({ confirmPassword: 'As senhas não conferem' });
  });

  it('asks for the e-mail and the password on login', () => {
    expect(authFieldErrors(zodError(SignInSchema, { email: '', password: '' }))).toEqual({
      email: 'Informe seu e-mail.',
      password: 'Informe sua senha.',
    });
  });
});
