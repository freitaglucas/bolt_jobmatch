import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Hourglass,
  MessageSquare,
  Moon,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import {
  CANDIDATE_STEPS,
  COMPANY_STEPS,
  HERO_SUBTITLE,
  HERO_TITLE,
  RETURN_POINTS,
} from '@/features/landing/content';

export type LandingRole = 'candidate' | 'recruiter';
export type LandingAuthMode = 'login' | 'signup';

interface LandingProps {
  onAuth: (role: LandingRole, mode: LandingAuthMode) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const RETURN_ICONS = [CalendarClock, Hourglass, MessageSquare, BadgeCheck];
const RETURN_COLORS = [
  { color: 'text-jm-teal', bg: 'bg-jm-teal/10' },
  { color: 'text-jm-orange', bg: 'bg-jm-orange/10' },
  { color: 'text-jm-purple', bg: 'bg-jm-purple/10' },
  { color: 'text-jm-teal', bg: 'bg-jm-teal/10' },
];

function StepList({ steps, accent }: { steps: string[]; accent: 'purple' | 'teal' }) {
  const badge =
    accent === 'purple' ? 'bg-jm-purple/15 text-jm-purple' : 'bg-jm-teal/15 text-jm-teal';
  return (
    <ol className="space-y-5">
      {steps.map((step, i) => (
        <li key={step} className="flex items-start gap-4">
          <div
            className={`w-8 h-8 rounded-full ${badge} flex items-center justify-center text-sm font-bold shrink-0`}
            aria-hidden="true"
          >
            {i + 1}
          </div>
          <p className="text-muted-foreground pt-1">{step}</p>
        </li>
      ))}
    </ol>
  );
}

export function Landing({ onAuth, darkMode, onToggleDark }: LandingProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size={32} />
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDark}
              className="rounded-lg"
              aria-label={darkMode ? 'Usar tema claro' : 'Usar tema escuro'}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" onClick={() => onAuth('candidate', 'login')}>
              Entrar
            </Button>
            <Button
              onClick={() => onAuth('recruiter', 'signup')}
              className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
            >
              Sou empresa
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-jm-purple/10 via-transparent to-jm-teal/10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-jm-purple/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-jm-teal/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              Retorno no prazo, com motivo
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
              {HERO_TITLE}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {HERO_SUBTITLE}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => onAuth('candidate', 'signup')}
                className="bg-gradient-purple-teal text-white border-0 hover:opacity-90 w-full sm:w-auto"
              >
                <Users className="h-5 w-5 mr-2" />
                Procuro vaga
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onAuth('recruiter', 'signup')}
                className="w-full sm:w-auto"
              >
                <Briefcase className="h-5 w-5 mr-2" />
                Sou empresa
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Já tem conta?{' '}
              <button
                type="button"
                onClick={() => onAuth('candidate', 'login')}
                className="text-primary hover:underline"
              >
                Entrar
              </button>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Como usar, por lado */}
      <section className="bg-card/50 border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como usar</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada lado tem o seu caminho. Quatro passos para começar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-border">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-jm-purple" aria-hidden="true" />
                  <h3 className="text-xl font-semibold">Para quem procura vaga</h3>
                </div>
                <StepList steps={CANDIDATE_STEPS} accent="purple" />
                <Button
                  onClick={() => onAuth('candidate', 'signup')}
                  className="w-full sm:w-auto bg-gradient-purple-teal text-white border-0 hover:opacity-90"
                >
                  Criar conta de candidato
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-6 w-6 text-jm-teal" aria-hidden="true" />
                  <h3 className="text-xl font-semibold">Para empresas</h3>
                </div>
                <StepList steps={COMPANY_STEPS} accent="teal" />
                <Button
                  variant="outline"
                  onClick={() => onAuth('recruiter', 'signup')}
                  className="w-full sm:w-auto"
                >
                  Criar conta da empresa
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* O retorno no prazo, explicado */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">O retorno no prazo, explicado</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            É a regra central do Job Match: quem se candidata sabe quando vai ter notícias.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {RETURN_POINTS.map((point, i) => {
            const Icon = RETURN_ICONS[i % RETURN_ICONS.length];
            const tone = RETURN_COLORS[i % RETURN_COLORS.length];
            return (
              <Card key={point.title} className="h-full border-border">
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${tone.bg} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`h-6 w-6 ${tone.color}`} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{point.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{point.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-20 text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-purple-teal blur-[60px] opacity-20" />
          <h2 className="relative text-3xl md:text-4xl font-bold mb-4">Pronto para começar?</h2>
        </div>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Candidatos criam o perfil e já veem as vagas. Empresas passam por uma aprovação
          antes de publicar a primeira vaga.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => onAuth('candidate', 'signup')}
            className="bg-gradient-purple-teal text-white border-0 hover:opacity-90 w-full sm:w-auto"
          >
            Procuro vaga
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => onAuth('recruiter', 'signup')}
            className="w-full sm:w-auto"
          >
            Sou empresa
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={24} />
          <p className="text-sm text-muted-foreground">Job Match 2026</p>
        </div>
      </footer>
    </div>
  );
}
