import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatchScoreRing } from '@/components/MatchScoreRing';
import {
  Briefcase,
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  ArrowRight,
  KanbanSquare,
  Coins,
  Plus,
  Clock,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { recruiterStats, mockPipelineCandidates, mockTokenEvents } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { Screen } from '@/components/Layout';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const stats = [
    { label: 'Vagas ativas', value: recruiterStats.activeJobs, icon: Briefcase, color: 'text-jm-purple', bg: 'bg-jm-purple/10' },
    { label: 'Candidaturas', value: recruiterStats.totalApplications, icon: Users, color: 'text-jm-teal', bg: 'bg-jm-teal/10' },
    { label: 'Novas', value: recruiterStats.newApplications, icon: UserPlus, color: 'text-jm-orange', bg: 'bg-jm-orange/10' },
    { label: 'Entrevistas', value: recruiterStats.interviews, icon: Calendar, color: 'text-jm-purple', bg: 'bg-jm-purple/10' },
  ];

  const hireStats = [
    { label: 'Vagas fechadas', value: recruiterStats.closedJobs, icon: Briefcase, color: 'text-jm-purple', bg: 'bg-jm-purple/10' },
    { label: 'Tempo médio', value: `${recruiterStats.avgTimeToHire}d`, icon: Clock, color: 'text-jm-teal', bg: 'bg-jm-teal/10' },
    { label: 'Custo médio', value: `R$ ${(recruiterStats.avgCostPerHire / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-jm-orange', bg: 'bg-jm-orange/10' },
    { label: 'Tokens ganhos', value: `+${recruiterStats.totalTokensFromHires}`, icon: Coins, color: 'text-jm-teal', bg: 'bg-jm-teal/10' },
  ];

  const topCandidates = [...mockPipelineCandidates]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral das suas vagas e candidatos
          </p>
        </div>
        <Button
          onClick={() => onNavigate('job-create')}
          className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova vaga
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-border hover:border-primary/20 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bg)}>
                    <stat.icon className={cn('h-6 w-6', stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Hire metrics */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Métricas de contratação
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {hireStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <Card className="border-border hover:border-primary/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
                      <stat.icon className={cn('h-5 w-5', stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          className="border-border cursor-pointer hover:border-primary/30 transition-all group"
          onClick={() => onNavigate('pipeline')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-jm-purple/10 flex items-center justify-center">
              <KanbanSquare className="h-7 w-7 text-jm-purple" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Pipeline de candidatos</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie o funil com drag & drop
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          </CardContent>
        </Card>

        <Card
          className="border-border cursor-pointer hover:border-primary/30 transition-all group"
          onClick={() => onNavigate('post-hire')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-jm-orange/10 flex items-center justify-center">
              <HeartHandshake className="h-7 w-7 text-jm-orange" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Pós-contratação</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe os 3 meses de experiência
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          </CardContent>
        </Card>

        <Card
          className="border-border cursor-pointer hover:border-primary/30 transition-all group"
          onClick={() => onNavigate('tokens')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-jm-teal/10 flex items-center justify-center">
              <Coins className="h-7 w-7 text-jm-teal" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Jornada do recrutamento</h3>
              <p className="text-sm text-muted-foreground">
                Saldo: {recruiterStats.tokenBalance} tokens
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          </CardContent>
        </Card>
      </div>

      {/* Top candidates + Token activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top candidates */}
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top candidatos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCandidates.map((candidate, i) => (
              <div
                key={candidate.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-muted-foreground text-sm font-semibold w-5">
                    {i + 1}
                  </div>
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0', candidate.avatarColor)}>
                    {candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{candidate.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {candidate.role} · {candidate.seniority}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {candidate.stage}
                </Badge>
                <MatchScoreRing score={candidate.matchScore} size={48} strokeWidth={4} showLabel={true} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Token activity */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-jm-teal" />
              Atividade de tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center pb-3 border-b border-border">
              <div className="text-3xl font-bold text-gradient-purple-teal">
                {recruiterStats.tokenBalance}
              </div>
              <div className="text-xs text-muted-foreground">tokens disponíveis</div>
            </div>
            {mockTokenEvents.slice(0, 4).map((event) => (
              <div key={event.id} className="flex items-center gap-3 text-sm">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                    event.type === 'earn' ? 'bg-jm-teal/15' : 'bg-jm-orange/15'
                  )}
                >
                  <span className={cn('text-xs font-bold', event.type === 'earn' ? 'text-jm-teal' : 'text-jm-orange')}>
                    {event.type === 'earn' ? '+' : '-'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{event.action}</p>
                  <p className="text-[10px] text-muted-foreground">{event.date}</p>
                </div>
                <span className={cn('text-sm font-semibold shrink-0', event.type === 'earn' ? 'text-jm-teal' : 'text-jm-orange')}>
                  {event.type === 'earn' ? '+' : '-'}{event.amount}
                </span>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onNavigate('tokens')}
            >
              Ver histórico completo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
