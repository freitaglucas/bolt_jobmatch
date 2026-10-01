import { describe, expect, it } from 'vitest';
import { ResetPasswordSchema, SignUpSchema } from './schemas';

const validSignUp = {
  email: 'candidate@test.local',
  password: 'senha123',
  confirmPassword: 'senha123',
  fullName: 'Candidata Teste',
  role: 'candidate',
  consentAccepted: true,
};

describe('SignUpSchema', () => {
  it('accepts a valid signup when consent is accepted', () => {
    expect(() => SignUpSchema.parse(validSignUp)).not.toThrow();
  });

  it('rejects signup when consent is not accepted', () => {
    expect(() =>
      SignUpSchema.parse({ ...validSignUp, consentAccepted: false }),
    ).toThrow();
  });

  it('rejects signup when consent is missing', () => {
    expect(() =>
      SignUpSchema.parse({
        email: validSignUp.email,
        password: validSignUp.password,
        confirmPassword: validSignUp.confirmPassword,
        fullName: validSignUp.fullName,
        role: validSignUp.role,
      }),
    ).toThrow();
  });

  it('accepts signup when password and confirmation match', () => {
    expect(() =>
      SignUpSchema.parse({
        ...validSignUp,
        password: 'abc12345',
        confirmPassword: 'abc12345',
      }),
    ).not.toThrow();
  });

  it('rejects signup when password and confirmation differ', () => {
    const result = SignUpSchema.safeParse({
      ...validSignUp,
      password: 'abc12345',
      confirmPassword: 'xyz98765',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmPasswordIssue = result.error.issues.find(
        (issue) => issue.path[0] === 'confirmPassword',
      );
      expect(confirmPasswordIssue?.message).toBe('As senhas não conferem');
    }
  });
});

describe('ResetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    expect(() =>
      ResetPasswordSchema.parse({
        password: 'novaSenha123',
        confirmPassword: 'novaSenha123',
      }),
    ).not.toThrow();
  });

  it('rejects mismatched passwords', () => {
    expect(() =>
      ResetPasswordSchema.parse({
        password: 'novaSenha123',
        confirmPassword: 'outra123',
      }),
    ).toThrow();
  });
});
