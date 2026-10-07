import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../../shared/lib/supabase';
import { emailErrorMessage } from './email-errors';

// TODO(N15): remover o botao de teste quando o primeiro template real existir.
// Pede para a edge function send-email mandar o e-mail de teste ao proprio recrutador.
export async function sendTestEmail(): Promise<void> {
  const { error } = await supabase.functions.invoke('send-email', {
    body: { template: 'test' },
  });

  if (error) {
    const status = error instanceof FunctionsHttpError ? error.context.status : undefined;
    throw new Error(emailErrorMessage(status));
  }
}
