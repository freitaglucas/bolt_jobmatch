import type { Screen } from '../components/Layout';

// Link de e-mail que abre o app direto numa tela (N74). O botao "Ver minha
// candidatura" usa <APP_URL>/?tela=candidaturas (supabase/functions/_shared/email-layout.ts).
export const DEEP_LINK_PARAM = 'tela';

const CANDIDATE_SCREENS: Readonly<Record<string, Screen>> = {
  candidaturas: 'applications',
};

// Tela pedida pelo link, ou null se nao houver (ou for desconhecida).
export function readDeepLinkScreen(search: string): Screen | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const value = params.get(DEEP_LINK_PARAM)?.trim().toLowerCase() ?? '';
  return Object.prototype.hasOwnProperty.call(CANDIDATE_SCREENS, value)
    ? (CANDIDATE_SCREENS[value] ?? null)
    : null;
}

// Endereco sem o parametro "tela" (para recarregar a pagina nao repetir o atalho).
export function stripDeepLinkParam(pathname: string, search: string, hash: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.delete(DEEP_LINK_PARAM);
  const rest = params.toString();
  return `${pathname}${rest ? `?${rest}` : ''}${hash}`;
}
