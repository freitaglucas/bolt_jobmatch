// Pure helpers that inspect the recovery/error parameters Supabase appends to the
// URL after a password reset flow. They never touch `window`, which keeps them
// trivially testable.

const AUTH_LINK_INVALID_MESSAGE =
  'Este link é inválido ou expirou. Peça um novo na tela de login.';

function readParams(search: string, hash: string): {
  search: URLSearchParams;
  hash: URLSearchParams;
} {
  return {
    search: new URLSearchParams(search.startsWith('?') ? search.slice(1) : search),
    hash: new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash),
  };
}

export function getRecoveryRedirectPath(
  pathname: string,
  search: string,
  hash: string,
): string | null {
  if (pathname === '/reset-password') {
    return null;
  }

  const { search: searchParams, hash: hashParams } = readParams(search, hash);
  const isRecovery =
    searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';

  if (!isRecovery) {
    return null;
  }

  return `/reset-password${search}${hash}`;
}

export function getAuthLinkError(search: string, hash: string): string | null {
  const { search: searchParams, hash: hashParams } = readParams(search, hash);
  const hasError =
    searchParams.has('error_code') ||
    searchParams.has('error') ||
    hashParams.has('error_code') ||
    hashParams.has('error');

  return hasError ? AUTH_LINK_INVALID_MESSAGE : null;
}
