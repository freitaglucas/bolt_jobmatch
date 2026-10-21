// Estado de topo do App (N76). Comeca em "loading" e so decide entre Landing,
// Auth e App depois que a sessao carregou: quem ja esta logado nunca ve a Landing piscar.
export type AppState = 'loading' | 'landing' | 'auth' | 'app';

export function resolveAppState(
  current: AppState,
  session: { isLoading: boolean; hasUser: boolean; hasRole: boolean },
): AppState {
  if (session.isLoading) {
    return current;
  }
  if (!session.hasUser) {
    return current === 'loading' ? 'landing' : current;
  }
  return session.hasRole ? 'app' : 'auth';
}
