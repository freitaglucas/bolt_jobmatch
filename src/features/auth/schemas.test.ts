import { describe, expect, it } from 'vitest';
import { SignUpSchema } from './schemas';

const validSignUp = {
  email: 'candidate@test.local',
  password: 'senha123',
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
        fullName: validSignUp.fullName,
        role: validSignUp.role,
      }),
    ).toThrow();
  });
});
