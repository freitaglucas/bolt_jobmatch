import { useEffect, useState, type FormEvent } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import {
  useRecruiterOnboarding,
  useSaveRecruiterOnboarding,
} from '../features/recruiters/hooks';
import { RecruiterOnboardingSchema } from '../features/recruiters/schemas';
import { useSendTestEmail } from '../features/email/hooks';

// "Minha empresa": o recrutador ve e edita o nome da empresa, o cargo e o telefone.
// TODO(F4): com N18/N19 a empresa passa a ter admin e recrutadores convidados.
export function Company() {
  const profileQuery = useRecruiterOnboarding();
  const saveMutation = useSaveRecruiterOnboarding();
  const testEmail = useSendTestEmail();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loaded = profileQuery.data;
  useEffect(() => {
    if (loaded) {
      setCompanyName(loaded.companyName ?? '');
      setPosition(loaded.position);
      setPhone(loaded.phone);
    }
  }, [loaded]);

  if (profileQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (profileQuery.isError || !loaded) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-destructive">
        Não foi possível carregar os dados da empresa. Tente novamente.
      </div>
    );
  }

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
    saveMutation.mutate(result.data, {
      onSuccess: () => toast({ title: 'Dados da empresa atualizados' }),
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Minha empresa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O nome da empresa aparece nas suas vagas para os candidatos.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Dados da empresa e do seu cargo
          </CardTitle>
          <CardDescription>
            Para trocar de empresa ou convidar outros recrutadores, aguarde as
            próximas versões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da empresa</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Ex: Acme Recrutamento"
              />
              {fieldErrors.companyName && (
                <p className="text-sm text-destructive">{fieldErrors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-position">Seu cargo</Label>
              <Input
                id="company-position"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                placeholder="Ex: Tech Recruiter"
              />
              {fieldErrors.position && (
                <p className="text-sm text-destructive">{fieldErrors.position}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-phone">Telefone (opcional)</Label>
              <Input
                id="company-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(11) 98765-4321"
                inputMode="tel"
              />
              {fieldErrors.phone && (
                <p className="text-sm text-destructive">{fieldErrors.phone}</p>
              )}
            </div>

            {saveMutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : 'Não foi possível salvar. Tente novamente.'}
              </p>
            )}

            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* TODO(N15): remover quando o primeiro e-mail real (retorno em lote) existir. */}
      <Card className="border-border mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Teste de e-mail</CardTitle>
          <CardDescription>
            Envia um e-mail de teste para o seu endereço de login, para conferir se o envio
            de e-mails está funcionando.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {testEmail.isError && (
            <p role="alert" className="text-sm text-destructive">
              {testEmail.error instanceof Error
                ? testEmail.error.message
                : 'Não foi possível enviar o e-mail. Tente de novo.'}
            </p>
          )}
          {testEmail.isSuccess && (
            <p className="text-sm text-muted-foreground">
              E-mail enviado. Confira a caixa de entrada (e o spam).
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={testEmail.isPending}
            onClick={() => testEmail.mutate()}
          >
            {testEmail.isPending ? 'Enviando...' : 'Enviar e-mail de teste'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
