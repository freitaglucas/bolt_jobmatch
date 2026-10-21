import { useState, type PropsWithChildren } from 'react';
import { GatePage, SessionSplash } from '@/components/GateShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useTcleConsent } from '../hooks';
import { TCLE_DRAFT_NOTICE } from '../content';
import { ConsentDialog } from './ConsentDialog';

interface TcleConsentGateProps {
  userId: string | null;
  // Sair sem aceitar (N76).
  onLogout?: () => void;
}

export function TcleConsentGate({
  userId,
  onLogout,
  children,
}: PropsWithChildren<TcleConsentGateProps>) {
  const { hasConsented, isLoading, accept, acceptError, isAccepting } =
    useTcleConsent(userId);
  const [checked, setChecked] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  if (isLoading) {
    return <SessionSplash label="Carregando…" />;
  }

  if (hasConsented) {
    return <>{children}</>;
  }

  return (
    <GatePage onLogout={onLogout}>
      <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold mb-2">
            Termos de Uso e Política de Privacidade
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Para continuar usando o Job Match, você precisa aceitar os Termos de
            Uso e a Política de Privacidade.
          </p>
          <p className="text-xs font-medium text-destructive mb-6">{TCLE_DRAFT_NOTICE}</p>

          <div className="flex items-start gap-2 mb-4">
            <Checkbox
              id="tcle-gate-checkbox"
              checked={checked}
              onCheckedChange={(value) => setChecked(value === true)}
            />
            <label
              htmlFor="tcle-gate-checkbox"
              className="text-sm text-muted-foreground leading-snug"
            >
              Li e aceito os{' '}
              <button
                type="button"
                className="text-primary underline underline-offset-2"
                onClick={() => setTermsOpen(true)}
              >
                Termos de Uso
              </button>{' '}
              e a{' '}
              <button
                type="button"
                className="text-primary underline underline-offset-2"
                onClick={() => setTermsOpen(true)}
              >
                Política de Privacidade
              </button>
              .
            </label>
          </div>

          {acceptError && (
            <p role="alert" className="text-sm text-destructive mb-4">
              Não foi possível registrar seu aceite. Confira sua conexão e tente de novo.
            </p>
          )}

          <Button
            type="button"
            disabled={!checked || isAccepting}
            onClick={() => void accept()}
            className="w-full bg-gradient-purple-teal text-white border-0 hover:opacity-90"
            size="lg"
          >
            {isAccepting ? 'Aguarde...' : 'Aceitar e continuar'}
          </Button>
        </CardContent>
      </Card>
      <ConsentDialog open={termsOpen} onOpenChange={setTermsOpen} />
    </GatePage>
  );
}
