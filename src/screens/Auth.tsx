import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Briefcase, ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';
import { useAuth } from '@/features/auth/hooks';
import { SignInSchema, SignUpSchema } from '@/features/auth/schemas';

interface AuthProps {
  onLogin: (role: Role) => void;
  onBack: () => void;
  darkMode: boolean;
}

export function Auth({ onLogin, onBack }: AuthProps) {
  const [role, setRole] = useState<Role>('candidate');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const auth = useAuth();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    try {
      if (mode === 'login') {
        const credentials = SignInSchema.parse({ email, password });
        const user = await auth.signIn(credentials);
        if (!user.role) {
          throw new Error(
            'Esta conta não tem um perfil candidato/recrutador associado. Entre em contato com o suporte.',
          );
        }
        onLogin(user.role);
        return;
      }

      const credentials = SignUpSchema.parse({
        email,
        password,
        fullName,
        role,
      });
      const result = await auth.signUp(credentials);
      if (result.requiresEmailConfirmation) {
        setNotice('Conta criada. Confirme seu e-mail antes de entrar.');
        return;
      }
      if (!result.user.role) {
        throw new Error('Não foi possível identificar o perfil da conta criada.');
      }
      onLogin(result.user.role);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a autenticação. Tente novamente.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
              <h1 className="text-2xl font-bold text-center mb-2">
                {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {mode === 'login' ? 'Entre para continuar' : 'Comece sua jornada'}
              </p>

              {/* Role toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                    role === 'candidate'
                      ? 'bg-gradient-purple-teal text-white shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Users className="h-4 w-4" />
                  Candidato
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                    role === 'recruiter'
                      ? 'bg-gradient-purple-teal text-white shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Briefcase className="h-4 w-4" />
                  Recrutador
                </button>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={submit}>
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        className="pl-9"
                        autoComplete="name"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@email.com"
                      className="pl-9"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      className="pl-9"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                {formError && (
                  <p role="alert" className="text-sm text-destructive">
                    {formError}
                  </p>
                )}
                {notice && (
                  <p role="status" className="text-sm text-jm-teal">
                    {notice}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={auth.isSigningIn || auth.isSigningUp}
                  className="w-full mt-6 bg-gradient-purple-teal text-white border-0 hover:opacity-90"
                  size="lg"
                >
                  {auth.isSigningIn || auth.isSigningUp
                    ? 'Aguarde...'
                    : mode === 'login'
                      ? 'Entrar'
                      : 'Criar conta'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-primary font-medium hover:underline"
                >
                  {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
                </button>
              </p>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
