import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

// Pecas comuns das telas de "portao" (TCLE, onboarding, aprovacao) e da carga
// da sessao (N76): todas tem logo e, com sessao aberta, o botao Sair.

export function GateHeader({ onLogout }: { onLogout?: () => void }) {
  return (
    <header className="px-4 h-16 flex items-center justify-between">
      <Logo size={28} />
      {onLogout && (
        <Button type="button" variant="ghost" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
          Sair
        </Button>
      )}
    </header>
  );
}

export function GatePage({
  onLogout,
  children,
}: {
  onLogout?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GateHeader onLogout={onLogout} />
      <main className="flex-1 flex items-center justify-center px-4 py-12">{children}</main>
    </div>
  );
}

// Tela neutra enquanto a sessao (ou o estado do portao) carrega. Nunca mostra a Landing.
export function SessionSplash({ label = 'Carregando sua sessão…' }: { label?: string }) {
  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="animate-pulse motion-reduce:animate-none">
        <Logo size={40} showText={false} />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function GateError({
  message,
  onRetry,
  onLogout,
}: {
  message: string;
  onRetry: () => void;
  onLogout?: () => void;
}) {
  return (
    <GatePage onLogout={onLogout}>
      <div className="flex flex-col items-center gap-4 text-center">
        <p role="alert" className="text-destructive">
          {message}
        </p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    </GatePage>
  );
}
