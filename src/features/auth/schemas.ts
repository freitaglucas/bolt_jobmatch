import { z } from 'zod';

export const UserRoleSchema = z.enum(['candidate', 'recruiter']);

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const SignUpSchema = SignInSchema.extend({
  fullName: z.string().trim().min(1),
  role: UserRoleSchema,
});