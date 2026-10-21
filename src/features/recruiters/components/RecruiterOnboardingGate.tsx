import { useState, type FormEvent, type ReactNode } from 'react';
import { GateError, GatePage, SessionSplash } from '@/components/GateShell';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
import { APPROVAL_SLA_TEXT, SUPPORT_EMAIL, approvalCheckToast } from '../approval';
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
  const { toast } = useToast();

  if (profileQuery.isLoading) {
    return <SessionSplash label="Carregando seus dados…" />;
  }

  if (profileQuery.isError && !profileQuery.data) {
    return (
      <GateError
        message="Não foi possível carregar seus dados de recrutador."
        onRetry={() => void profileQuery.refetch()}
        onLogout={onLogout}
      />
    );
  }

  if (!profileQuery.data) {
    return <SessionSplash label="Carregando seus dados…" />;
  }

  const checkApproval = async () => {
    const result = await profileQuery.refetch();
    const feedback = approvalCheckToast({
      isError: result.isError,
      state: result.data ? getRecruiterGateState(result.data) : null,
    });
    if (feedback) {
      toast(feedback);
    }
  };

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
    <GatePage onLogout={onLogout}>
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
            isChecking={profileQuery.isFetching}
            onCheck={() => void checkApproval()}
            onEdit={() => {
              setEditing(true);
              setSubmittedSummary(null);
            }}
          />
        )}
      </div>
    </GatePage>
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
  isChecking,
  onCheck,
  onEdit,
}: {
  profile: RecruiterOnboardingProfile;
  isChecking: boolean;
  onCheck: () => void;
  onEdit: () => void;
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
        <div className="rounded-lg bg-muted/50 p-4 space-y-1 text-sm">
          <p>
            <span className="font-medium">Prazo da análise:</span> {APPROVAL_SLA_TEXT}.
          </p>
          <p className="text-muted-foreground">
            Dúvidas? Escreva para{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-primary underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={onCheck}
            disabled={isChecking}
            className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
          >
            {isChecking ? 'Verificando...' : 'Verificar aprovação'}
          </Button>
          <Button type="button" variant="outline" onClick={onEdit}>
            Editar dados
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
