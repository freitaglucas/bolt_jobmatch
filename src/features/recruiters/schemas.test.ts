import { describe, expect, it } from 'vitest';
import { RecruiterOnboardingSchema } from './schemas';

function validInput() {
  return {
    companyName: 'Acme Recrutamento',
    position: 'Tech Recruiter',
    phone: '',
  };
}

describe('RecruiterOnboardingSchema', () => {
  it('accepts a valid input with empty phone', () => {
    expect(() => RecruiterOnboardingSchema.parse(validInput())).not.toThrow();
  });

  it('rejects an empty company name', () => {
    expect(() =>
      RecruiterOnboardingSchema.parse({ ...validInput(), companyName: '' }),
    ).toThrow();
  });

  it('rejects a company name shorter than 2 characters', () => {
    expect(() =>
      RecruiterOnboardingSchema.parse({ ...validInput(), companyName: 'A' }),
    ).toThrow();
  });

  it('rejects a short position', () => {
    expect(() =>
      RecruiterOnboardingSchema.parse({ ...validInput(), position: 'R' }),
    ).toThrow();
  });

  it('rejects a phone with 9 digits', () => {
    expect(() =>
      RecruiterOnboardingSchema.parse({
        ...validInput(),
        phone: '123456789',
      }),
    ).toThrow();
  });

  it('rejects a phone with 12 digits', () => {
    expect(() =>
      RecruiterOnboardingSchema.parse({
        ...validInput(),
        phone: '123456789012',
      }),
    ).toThrow();
  });

  it('accepts an empty phone', () => {
    expect(() =>
      RecruiterOnboardingSchema.parse({ ...validInput(), phone: '' }),
    ).not.toThrow();
  });

  it('accepts a formatted phone like "(11) 98765-4321"', () => {
    expect(() =>
      RecruiterOnboardingSchema.parse({
        ...validInput(),
        phone: '(11) 98765-4321',
      }),
    ).not.toThrow();
  });
});
