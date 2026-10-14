import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../../shared/lib/supabase';
import { batchRequestErrorMessage } from './batch-feedback.errors';
import {
  batchResponseSchema,
  type BatchRequestItem,
  type BatchResponse,
} from './batch-feedback.schemas';

// Pede para a edge function send-email registrar e enviar o retorno de ate 25
// candidatos (gratis, sem token). Quem chama divide lotes maiores.
export async function sendBatchFeedback(
  items: BatchRequestItem[],
): Promise<BatchResponse> {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { template: 'batch_feedback', items },
  });

  if (error) {
    const status = error instanceof FunctionsHttpError ? error.context.status : undefined;
    throw new Error(batchRequestErrorMessage(status));
  }

  const parsed = batchResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(batchRequestErrorMessage(undefined));
  }
  return parsed.data;
}
