import type { RecruiterGateState } from './types';

// Espera da aprovacao do recrutador (N76): prazo, contato e retorno do botao
// "Verificar aprovacao".
export const APPROVAL_SLA_TEXT = 'até 1 dia útil';
export const SUPPORT_EMAIL = 'lucas@jobmatchrh.com';

export interface ApprovalCheckToast {
  title: string;
  description: string;
}

// Toast depois de "Verificar aprovacao". null = o app ja libera sozinho (aprovado)
// ou mostra o formulario (dados faltando).
export function approvalCheckToast(result: {
  isError: boolean;
  state: RecruiterGateState | null;
}): ApprovalCheckToast | null {
  if (result.isError) {
    return {
      title: 'Não foi possível verificar agora',
      description: 'Confira sua conexão e tente de novo em instantes.',
    };
  }
  if (result.state === 'pending') {
    return {
      title: 'Ainda em análise',
      description: `A análise leva ${APPROVAL_SLA_TEXT}. Se precisar, escreva para ${SUPPORT_EMAIL}.`,
    };
  }
  return null;
}
