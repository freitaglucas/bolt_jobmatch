import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  HeartHandshake,
  KanbanSquare,
  Plus,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { MatchScoreRing } from '../components/MatchScoreRing';
import type { Screen } from '../components/Layout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  buildDashboardStats,
  pickTopCandidates,
} from '../features/applications/dashboard-stats';
import { mapRecruiterApplication } from '../features/applications/recruiter-applications';
import { useRecruiterApplications } from '../features/applications/recruiter-applications.hooks';
import { useRecruiterJobs } from '../features/jobs/recruiter-jobs.hooks';
import { cn } from '../lib/utils';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const applicationsQuery = useRecruiterApplications();
  const jobsQuery = useRecruiterJobs();

  const candidates = useMemo(
    () =>
      (applicationsQuery.data ?? []).flatMap((row) => {
        const candidate = mapRecruiterApplication(row);
        return candidate ? [candidate] : [];
      }),
    [applicationsQuery.data],
  );

  const summary = useMemo(
    () => buildDashboardStats(candidates, jobsQuery.data ?? []),
    [candidates, jobsQuery.data],
  );
  const topCandidates = useMemo(() => pickTopCandidates(candidates), [candidates]);

  if (applicationsQuery.isLoading || jobsQuery.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-sm text-muted-foreground">
        Carregando o dashboard...
      </div>
    );
  }

  if (applicationsQuery.isError || jobsQuery.isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-3">
        <p className="text-sm text-destructive">
          Não foi possível carregar o dashboard.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void applicationsQuery.refetch();
            void jobsQuery.refetch();
          }}
        >
          Tentar de novo
        </Button>
      </div>
    );
  }

  const stats = [
    { label: 'Vagas ativas', value: summary.activeJobs, icon: Briefcase, color: 'text-jm-purple', bg: 'bg-jm-purple/10' },
    { label: 'Candidaturas', value: summary.totalApplications, icon: Users, color: 'text-jm-teal', bg: 'bg-jm-teal/10' },
    { label: 'Novas (em análise)', value: summary.newApplications, icon: UserPlus, color: 'text-jm-orange', bg: 'bg-jm-orange/10' },
    { label: 'Em entrevista', value: summary.interviews, icon: Calendar, color: 'text-jm-purple', bg: 'bg-jm-purple/10' },
  ];

  const resultStats = [
    { label: 'Aprovados', value: summary.approved, icon: CheckCircle2, color: 'text-jm-teal', bg: 'bg-jm-teal/10' },
    { label: 'Rejeitados', value: summary.rejected, icon: XCircle, color: 'text-jm-red', bg: 'bg-jm-red/10' },
    { label: 'Vagas pausadas ou em rascunho', value: summary.pausedOrDraftJobs, icon: Clock, color: 'text-jm-orange', bg: 'bg-jm-orange/10' },
    { label: 'Vagas fechadas', value: summary.closedJobs, icon: Briefcase, color: 'text-jm-purple', bg: 'bg-jm-purple/10' },
  ];

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
            key={stat.label}
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

      {/* Result metrics */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Resultado das candidaturas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {resultStats.map((stat, i) => (
            <motion.div
              key={stat.label}
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
                Mova candidatos entre as etapas e envie feedback
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
                Saldo e extrato em breve
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          </CardContent>
        </Card>
      </div>

      {/* Top candidates */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top candidatos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topCandidates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma candidatura recebida ainda.
            </p>
          )}
          {topCandidates.map((candidate, i) => (
            <div
              key={candidate.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-muted-foreground text-sm font-semibold w-5">
                  {i + 1}
                </div>
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                    candidate.avatarColor,
                  )}
                >
                  {initials(candidate.name)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{candidate.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {candidate.role} · {candidate.seniority}
                  </div>
                  {candidate.jobTitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {candidate.jobTitle}
                    </div>
                  )}
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
    </div>
  );
}
