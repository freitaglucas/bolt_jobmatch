import { z } from 'zod';

export const RecruiterOnboardingSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, { message: 'O nome da empresa deve ter pelo menos 2 caracteres.' })
    .max(120, {
      message: 'O nome da empresa deve ter no máximo 120 caracteres.',
    }),
  position: z
    .string()
    .trim()
    .min(2, { message: 'O cargo deve ter pelo menos 2 caracteres.' })
    .max(80, { message: 'O cargo deve ter no máximo 80 caracteres.' }),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      if (value.length === 0) {
        return true;
      }
      const digits = value.replace(/[\s()-]/g, '');
      return /^\d{10,11}$/.test(digits);
    }, { message: 'Informe um telefone válido com DDD (10 ou 11 dígitos).' }),
});
