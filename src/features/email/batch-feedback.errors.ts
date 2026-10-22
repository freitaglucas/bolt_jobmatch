// Mensagens para o recrutador quando o retorno em lote falha. O status vem da
// edge function send-email (ver supabase/functions/send-email).
export function batchRequestErrorMessage(status: number | undefined): string {
  switch (status) {
    case 400:
      return 'O pedido de retorno em lote não foi aceito. Confira os textos e tente de novo.';
    case 401:
      return 'Sua sessão expirou. Entre de novo e tente outra vez.';
    case 403:
      return 'Sua conta de recrutador ainda não foi aprovada para enviar retornos.';
    case 500:
      return 'O envio de e-mails ainda não foi configurado no servidor.';
    default:
      return 'Não foi possível enviar os retornos. Tente de novo.';
  }
}

// Motivo, em português, de um item que a edge function não enviou ou recusou.
const ITEM_ERROR_LABELS: Record<string, string> = {
  application_not_found: 'Candidatura não encontrada nas suas vagas.',
  no_recipient: 'O candidato não tem e-mail válido.',
  already_sent: 'Este candidato já recebeu esta decisão por e-mail nesta etapa.',
  duplicate_in_batch: 'Candidatura repetida no mesmo envio.',
  invalid_item: 'Dados do retorno inválidos.',
  invalid_message: 'A mensagem precisa ter entre 10 e 1000 caracteres.',
  invalid_due_date: 'A nova data precisa ser depois do prazo atual.',
  postpone_limit_reached: 'Já foram usados os 2 adiamentos desta etapa.',
  postpone_too_long: 'A nova data passa de 14 dias.',
  stage_without_deadline: 'Esta etapa não tem prazo de retorno.',
  not_allowed: 'Sem permissão para esta candidatura.',
  stage_not_final: 'Só quem está na etapa Final pode ficar em reserva.',
  already_reserved: 'Este candidato já está em reserva.',
  not_reserved: 'Este candidato não está mais em reserva.',
  renewal_limit_reached: 'A reserva já foi renovada uma vez.',
  email_failed: 'O retorno ficou registrado no app, mas o e-mail não saiu.',
};

export function batchItemErrorLabel(code: string | undefined): string {
  if (!code) {
    return 'Não foi possível enviar este retorno.';
  }
  return ITEM_ERROR_LABELS[code] ?? 'Não foi possível enviar este retorno.';
}
