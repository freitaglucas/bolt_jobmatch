import { useState, type FormEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { ZodError } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useAuth,
  useRequestPasswordReset,
  useUpdatePassword,
} from '@/features/auth/hooks';
import { ResetPasswordSchema } from '@/features/auth/schemas';

interface ResetPasswordProps {
  onBackToLogin: () => void;
}

const NEUTRAL_RESET_MESSAGE =
  'Se esse e-mail estiver cadastrado, enviaremos um link para redefinir a senha.';

export function ResetPassword({ onBackToLogin }: ResetPasswordProps) {
  const { toast } = useToast();
  const auth = useAuth();
  const updatePassword = useUpdatePassword();
  const requestPasswordReset = useRequestPasswordReset();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const leaveRecovery = async () => {
    try {
      await auth.signOut();
    } catch {
      // No active session: nothing to sign out.
    }
    onBackToLogin();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmPasswordError(null);

    try {
      const validated = ResetPasswordSchema.parse({ password, confirmPassword });
      await updatePassword.mutateAsync(validated.password);
      await auth.signOut();
      toast({
        title: 'Senha redefinida',
        description: 'Faça login com sua nova senha.',
      });
      onBackToLogin();
    } catch (error) {
      if (error instanceof ZodError) {
        const confirmPasswordIssue = error.issues.find(
          (issue) => issue.path[0] === 'confirmPassword',
        );
        setConfirmPasswordError(
          confirmPasswordIssue
            ? confirmPasswordIssue.message
            : 'Verifique os campos e tente novamente.',
        );
        return;
      }
      setConfirmPasswordError('Não foi possível redefinir a senha. Tente novamente.');
    }
  };

  const submitForgot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await requestPasswordReset.mutateAsync(forgotEmail);
    setForgotSent(true);
  };

  let content: ReactNode;
  if (auth.isLoading) {
    content = <p className="text-sm text-muted-foreground text-center">Carregando...</p>;
  } else if (!auth.user) {
    content = (
      <form className="space-y-4" onSubmit={submitForgot}>
        <p role="alert" className="text-sm text-destructive">
          Este link de redefinição é inválido ou expirou.
        </p>
        <div className="space-y-2">
          <Label htmlFor="reset-email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="reset-email"
              type="email"
              placeholder="voce@email.com"
              className="pl-9"
              autoComplete="email"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              required
            />
          </div>
        </div>
        {forgotSent && (
          <p role="status" className="text-sm text-jm-teal">
            {NEUTRAL_RESET_MESSAGE}
          </p>
        )}
        <Button
          type="submit"
          disabled={requestPasswordReset.isPending}
          className="w-full mt-6 bg-gradient-purple-teal text-white border-0 hover:opacity-90"
          size="lg"
        >
          {requestPasswordReset.isPending ? 'Enviando...' : 'Pedir novo link'}
        </Button>
        <button
          type="button"
          onClick={leaveRecovery}
          className="w-full text-center text-sm text-primary font-medium hover:underline"
        >
          Voltar para o login
        </button>
      </form>
    );
  } else {
    content = (
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="new-password"
              type="password"
              placeholder="Sua nova senha"
              className="pl-9"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm-new-password"
              type="password"
              placeholder="Repita sua nova senha"
              className="pl-9"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setConfirmPasswordError(null);
              }}
              minLength={6}
              required
            />
          </div>
          {confirmPasswordError && (
            <p role="alert" className="text-sm text-destructive">
              {confirmPasswordError}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={updatePassword.isPending}
          className="w-full mt-6 bg-gradient-purple-teal text-white border-0 hover:opacity-90"
          size="lg"
        >
          {updatePassword.isPending ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
        <button
          type="button"
          onClick={leaveRecovery}
          className="w-full text-center text-sm text-primary font-medium hover:underline"
        >
          Voltar para o login
        </button>
      </form>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between">
        <button
          onClick={leaveRecovery}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <Logo size={28} />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <h1 className="text-2xl font-bold text-center mb-2">Redefinir senha</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {auth.user
                  ? 'Defina uma nova senha para sua conta.'
                  : 'Solicite um novo link de redefinição.'}
              </p>
              {content}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
