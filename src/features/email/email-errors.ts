// Mensagens para o recrutador quando o envio de e-mail falha. O status vem da
// edge function send-email (ver supabase/functions/send-email).
export function emailErrorMessage(status: number | undefined): string {
  switch (status) {
    case 401:
      return 'Sua sessão expirou. Entre de novo e tente outra vez.';
    case 403:
      return 'Sua conta de recrutador ainda não foi aprovada para enviar e-mails.';
    case 429:
      return 'Limite de e-mails de teste por hora atingido. Tente de novo mais tarde.';
    case 500:
      return 'O envio de e-mails ainda não foi configurado no servidor.';
    default:
      return 'Não foi possível enviar o e-mail. Tente de novo.';
  }
}
