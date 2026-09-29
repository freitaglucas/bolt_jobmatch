import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Coins,
  TrendingUp,
  Gift,
  ArrowDownLeft,
  ArrowUpRight,
  Trophy,
  Star,
  Target,
  Zap,
} from 'lucide-react';
import { mockTokenEvents, recruiterStats } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const rewards = [
  { id: 'r1', icon: Star, title: 'Vaga em destaque', cost: 50, color: 'text-jm-purple', bg: 'bg-jm-purple/10' },
  { id: 'r2', icon: Target, title: 'Banco de talentos premium', cost: 100, color: 'text-jm-teal', bg: 'bg-jm-teal/10' },
  { id: 'r3', icon: Zap, title: 'Busca avançada com IA', cost: 80, color: 'text-jm-orange', bg: 'bg-jm-orange/10' },
  { id: 'r4', icon: Trophy, title: 'Relatório de tendências', cost: 60, color: 'text-jm-purple', bg: 'bg-jm-purple/10' },
];

const milestones = [
  { label: 'Primeira contratação', tokens: 100, done: true },
  { label: '5 candidaturas qualificadas', tokens: 50, done: true },
  { label: 'Vaga com 10+ candidatos', tokens: 30, done: true },
  { label: 'Contratação com match >= 90%', tokens: 150, done: false },
];

export function Tokens() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Jornada do Recrutamento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ganhe tokens por boas contratações e troque por benefícios
        </p>
      </div>

      {/* Token balance hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-border overflow-hidden mb-6">
          <div className="bg-gradient-purple-teal p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="h-6 w-6 text-white" />
              <span className="text-white/80 text-sm font-medium">Saldo de tokens</span>
            </div>
            <div className="text-5xl font-bold text-white">
              {recruiterStats.tokenBalance}
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge className="bg-white/15 text-white border-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                +85 este mês
              </Badge>
              <Badge className="bg-white/15 text-white border-0">
                <Trophy className="h-3 w-3 mr-1" />
                Nível Ouro
              </Badge>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Rewards + Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Rewards */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-primary" />
              Recompensas disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rewards.map((reward) => {
              const canAfford = recruiterStats.tokenBalance >= reward.cost;
              return (
                <div
                  key={reward.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 transition-colors"
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', reward.bg)}>
                    <reward.icon className={cn('h-5 w-5', reward.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium">{reward.title}</h4>
                    <p className="text-xs text-muted-foreground">{reward.cost} tokens</p>
                  </div>
                  <Button
                    size="sm"
                    variant={canAfford ? 'default' : 'outline'}
                    disabled={!canAfford}
                    className={canAfford ? 'bg-gradient-purple-teal text-white border-0' : ''}
                  >
                    {canAfford ? 'Resgatar' : 'Insuficiente'}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-jm-teal" />
              Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.map((milestone, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                    milestone.done ? 'bg-jm-teal/15' : 'bg-muted'
                  )}
                >
                  <Trophy
                    className={cn(
                      'h-5 w-5',
                      milestone.done ? 'text-jm-teal' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium">{milestone.label}</h4>
                  <p className="text-xs text-muted-foreground">
                    +{milestone.tokens} tokens
                  </p>
                </div>
                {milestone.done ? (
                  <Badge className="bg-jm-teal/15 text-jm-teal border-0">Concluído</Badge>
                ) : (
                  <Badge variant="outline">Em progresso</Badge>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Histórico de tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockTokenEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                    event.type === 'earn' ? 'bg-jm-teal/15' : 'bg-jm-orange/15'
                  )}
                >
                  {event.type === 'earn' ? (
                    <ArrowDownLeft className="h-5 w-5 text-jm-teal" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-jm-orange" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{event.action}</p>
                  <p className="text-xs text-muted-foreground">{event.date}</p>
                </div>
                <span
                  className={cn(
                    'text-sm font-bold shrink-0',
                    event.type === 'earn' ? 'text-jm-teal' : 'text-jm-orange'
                  )}
                >
                  {event.type === 'earn' ? '+' : '-'}{event.amount}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
