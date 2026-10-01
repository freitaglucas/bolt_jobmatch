import { z } from 'zod';

export const UserRoleSchema = z.enum(['candidate', 'recruiter']);

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const SignUpSchema = SignInSchema.extend({
  fullName: z.string().trim().min(1),
  role: UserRoleSchema,
  consentAccepted: z.boolean().refine((value) => value === true, {
    message: 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(1),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });