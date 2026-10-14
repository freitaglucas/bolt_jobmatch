import { FunctionsHttpError } from '@supabase/supabase-js';
import { z } from 'zod';
import { supabase } from '../../shared/lib/supabase';
import { batchRequestErrorMessage } from './batch-feedback.errors';

// Resposta da edge function send-email para o template stage_update (N71).
const stageUpdateResponseSchema = z.object({
  status: z.enum(['sent', 'failed', 'skipped_duplicate', 'skipped']),
  error: z.string().optional(),
});
export type StageUpdateResponse = z.infer<typeof stageUpdateResponseSchema>;

// Pede o aviso automatico de mudanca de etapa ao candidato (gratis, sem texto
// livre: a funcao monta a mensagem com a etapa nova e o proximo prazo de retorno).
// Quem chama ja mudou a etapa; uma falha aqui nao desfaz nada.
export async function sendStageUpdate(applicationId: string): Promise<StageUpdateResponse> {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { template: 'stage_update', application_id: applicationId },
  });

  if (error) {
    const status = error instanceof FunctionsHttpError ? error.context.status : undefined;
    throw new Error(batchRequestErrorMessage(status));
  }

  const parsed = stageUpdateResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(batchRequestErrorMessage(undefined));
  }
  return parsed.data;
}
