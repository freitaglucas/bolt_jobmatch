import { z } from 'zod';

export const UserRoleSchema = z.enum(['candidate', 'recruiter']);

// Regra de senha do Supabase Auth (minimo de 6). Mostrada na tela como dica (N75).
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_HINT = `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`;

const EmailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .email('Informe um e-mail válido, como voce@email.com.');

const NewPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha precisa ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`);

export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
});

export const SignUpSchema = SignInSchema.extend({
  password: NewPasswordSchema,
  fullName: z
    .string()
    .trim()
    .min(1, 'Informe seu nome completo.')
    .max(120, 'O nome pode ter no máximo 120 caracteres.'),
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
    password: NewPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });