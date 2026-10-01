import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Moon,
  Sun,
  Target,
  Heart,
  FileCheck,
  Coins,
  ArrowRight,
  Users,
  Briefcase,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface LandingProps {
  onAuth: (role: 'candidate' | 'recruiter') => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const pillars = [
  {
    icon: Target,
    title: 'Competências Reais',
    description:
      'Mapeamos o que você realmente sabe fazer, não apenas diplomas. Skills com níveis validados por projetos.',
    color: 'text-jm-purple',
    bgColor: 'bg-jm-purple/10',
  },
  {
    icon: Heart,
    title: 'Swipe + Match Score',
    description:
      'Navegue vagas em segundos. Veja sua compatibilidade antes de se candidatar, com score de 0 a 100%.',
    color: 'text-jm-teal',
    bgColor: 'bg-jm-teal/10',
  },
  {
    icon: FileCheck,
    title: 'Evidência, não currículo',
    description:
      'Projetos, entregas e resultados falam mais alto. O candidato prova, o recrutador confere.',
    color: 'text-jm-orange',
    bgColor: 'bg-jm-orange/10',
  },
  {
    icon: Coins,
    title: 'Jornada com Tokens',
    description:
      'Recrutadores ganham tokens por boas contratações. Gamificação que premia qualidade sobre quantidade.',
    color: 'text-jm-purple',
    bgColor: 'bg-jm-purple/10',
  },
];

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
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onAuth('candidate')}
              className="hidden sm:inline-flex"
            >
              Entrar como candidato
            </Button>
            <Button
              onClick={() => onAuth('recruiter')}
              className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
            >
              Sou recrutador
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
              O novo jeito de conectar talentos e vagas
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
              Encontre o <span className="text-gradient-purple-teal">match perfeito</span>
              <br />
              entre talentos e vagas.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Match Score baseado em competências reais. Swipe para candidatos,
              pipeline inteligente para recrutadores. Sem fricção, com evidência.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => onAuth('candidate')}
                className="bg-gradient-purple-teal text-white border-0 hover:opacity-90 w-full sm:w-auto"
              >
                <Users className="h-5 w-5 mr-2" />
                Sou candidato
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onAuth('recruiter')}
                className="w-full sm:w-auto"
              >
                <Briefcase className="h-5 w-5 mr-2" />
                Sou recrutador
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '92%', label: 'Match médio das contratações' },
            { value: '3x', label: 'Mais rápido que processo tradicional' },
            { value: '50+', label: 'Vagas ativas no piloto' },
            { value: '340', label: 'Tokens distribuídos a recrutadores' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-2xl md:text-3xl font-bold text-gradient-purple-teal">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">4 pilares que nos diferenciam</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Não é mais um portal de vagas. É uma plataforma construída para matches reais.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-border hover:border-primary/30 transition-all hover:glow-purple">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${pillar.bgColor} flex items-center justify-center mb-4`}>
                    <pillar.icon className={`h-6 w-6 ${pillar.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card/50 border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-jm-purple" />
                <h3 className="text-xl font-semibold">Para candidatos</h3>
              </div>
              {[
                'Cadastre suas competências com nível e projetos',
                'Navegue vagas com swipe e veja o Match Score',
                'Candidate-se apenas às vagas com bom fit',
                'Acompanhe o status em tempo real',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-jm-purple/15 text-jm-purple flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-muted-foreground pt-1">{step}</p>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="h-6 w-6 text-jm-teal" />
                <h3 className="text-xl font-semibold">Para recrutadores</h3>
              </div>
              {[
                'Publique vagas com competências exigidas',
                'Receba candidatos ordenados por Match Score',
                'Gerencie o pipeline com drag & drop',
                'Ganhe tokens por contratações de qualidade',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-jm-teal/15 text-jm-teal flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-muted-foreground pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-purple-teal blur-[60px] opacity-20" />
            <h2 className="relative text-3xl md:text-4xl font-bold mb-4">
              Pronto para começar?
            </h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Experimente o protótipo agora. Escolha seu perfil e explore a plataforma.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => onAuth('candidate')}
              className="bg-gradient-purple-teal text-white border-0 hover:opacity-90 w-full sm:w-auto"
            >
              Explarar como candidato
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onAuth('recruiter')}
              className="w-full sm:w-auto"
            >
              Explorar como recrutador
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={24} />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Protótipo visual
            </span>
            <span>JobMatch 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
