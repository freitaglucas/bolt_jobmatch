import { useState, type FormEvent, type ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getRecruiterGateState } from '../api';
import { useRecruiterOnboarding, useSaveRecruiterOnboarding } from '../hooks';
import { RecruiterOnboardingSchema } from '../schemas';
import type {
  RecruiterOnboardingProfile,
  SaveRecruiterOnboardingInput,
} from '../types';

interface RecruiterOnboardingGateProps {
  children: ReactNode;
  onLogout: () => void;
}

export function RecruiterOnboardingGate({
  children,
  onLogout,
}: RecruiterOnboardingGateProps) {
  const profileQuery = useRecruiterOnboarding();
  const saveMutation = useSaveRecruiterOnboarding();
  const [editing, setEditing] = useState(false);
  const [submittedSummary, setSubmittedSummary] =
    useState<RecruiterOnboardingProfile | null>(null);

  if (profileQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (profileQuery.isError) {
    return <ErrorScreen onRetry={() => void profileQuery.refetch()} />;
  }

  if (!profileQuery.data) {
    return <LoadingScreen />;
  }

  const profile = profileQuery.data;
  const state = getRecruiterGateState(profile);

  if (state === 'approved') {
    return <>{children}</>;
  }

  // Aprovado sem empresa: mostra o formulario e, ao salvar, o app libera sozinho.
  const needsCompany = state === 'company';
  const showForm =
    editing || needsCompany || (state === 'form' && submittedSummary === null);
  const summary = submittedSummary ?? profile;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between">
        <Logo size={28} />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {showForm ? (
            <RecruiterOnboardingForm
              initialValues={summary}
              needsCompany={needsCompany}
              isSubmitting={saveMutation.isPending}
              submitError={
                saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : null
              }
              onSubmit={(input) =>
                saveMutation.mutate(input, {
                  onSuccess: () => {
                    if (needsCompany) {
                      return;
                    }
                    setSubmittedSummary({
                      companyId: profile.companyId,
                      companyName: input.companyName,
                      position: input.position,
                      phone: input.phone,
                      approvedAt: null,
                    });
                    setEditing(false);
                  },
                })
              }
            />
          ) : (
            <RecruiterPendingApproval
              profile={summary}
              onCheck={() => void profileQuery.refetch()}
              onEdit={() => {
                setEditing(true);
                setSubmittedSummary(null);
              }}
              onLogout={onLogout}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      Carregando...
    </div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-destructive">
        Não foi possível carregar seus dados de recrutador. Tente novamente.
      </p>
      <Button type="button" variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

function RecruiterOnboardingForm({
  initialValues,
  needsCompany,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  initialValues: RecruiterOnboardingProfile;
  needsCompany: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (input: SaveRecruiterOnboardingInput) => void;
}) {
  const [companyName, setCompanyName] = useState(
    initialValues.companyName ?? '',
  );
  const [position, setPosition] = useState(initialValues.position);
  const [phone, setPhone] = useState(initialValues.phone);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = RecruiterOnboardingSchema.safeParse({
      companyName,
      position,
      phone,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSubmit(result.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {needsCompany
            ? 'Falta só a sua empresa'
            : 'Conte um pouco sobre você e sua empresa'}
        </CardTitle>
        {needsCompany && (
          <CardDescription>
            Sua conta já está aprovada. Informe a empresa para publicar vagas.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da empresa</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Ex: Acme Recrutamento"
            />
            {fieldErrors.companyName && (
              <p className="text-sm text-destructive">{fieldErrors.companyName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Seu cargo</Label>
            <Input
              id="position"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              placeholder="Ex: Tech Recruiter"
            />
            {fieldErrors.position && (
              <p className="text-sm text-destructive">{fieldErrors.position}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(11) 98765-4321"
              inputMode="tel"
            />
            {fieldErrors.phone && (
              <p className="text-sm text-destructive">{fieldErrors.phone}</p>
            )}
          </div>

          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-purple-teal text-white border-0 hover:opacity-90 w-full"
          >
            {isSubmitting
              ? 'Salvando...'
              : needsCompany
                ? 'Salvar empresa'
                : 'Enviar cadastro'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RecruiterPendingApproval({
  profile,
  onCheck,
  onEdit,
  onLogout,
}: {
  profile: RecruiterOnboardingProfile;
  onCheck: () => void;
  onEdit: () => void;
  onLogout: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro recebido!</CardTitle>
        <CardDescription>
          Sua conta de recrutador está em análise. Assim que for aprovada, você
          poderá publicar vagas e ver candidatos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border p-4 space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Empresa</p>
            <p className="font-medium">{profile.companyName ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cargo</p>
            <p className="font-medium">{profile.position}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={onCheck}
            className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
          >
            Verificar aprovação
          </Button>
          <Button type="button" variant="outline" onClick={onEdit}>
            Editar dados
          </Button>
          <Button type="button" variant="ghost" onClick={onLogout}>
            Sair
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
