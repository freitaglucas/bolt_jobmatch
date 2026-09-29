import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Star,
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
  Award,
  MessageSquare,
  Calendar,
  User,
  Briefcase,
  Coins,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MatchScoreRing } from '@/components/MatchScoreRing';
import { mockPostHireRecords, recruiterStats } from '@/lib/mock-data';
import type { PostHireRecord, PostHireCheckpoint, PostHireFeedback, CheckpointStatus } from '@/lib/types';

interface PostHireProps {
  onBack: () => void;
}

const checkpointIcons: Record<CheckpointStatus, typeof CheckCircle2> = {
  completed: CheckCircle2,
  in_progress: Zap,
  pending: Circle,
  at_risk: AlertCircle,
};

const checkpointColors: Record<CheckpointStatus, { icon: string; bg: string; text: string; label: string }> = {
  completed: { icon: 'text-jm-teal', bg: 'bg-jm-teal/15', text: 'text-jm-teal', label: 'Concluído' },
  in_progress: { icon: 'text-jm-purple', bg: 'bg-jm-purple/15', text: 'text-jm-purple', label: 'Em andamento' },
  pending: { icon: 'text-muted-foreground', bg: 'bg-muted', text: 'text-muted-foreground', label: 'Pendente' },
  at_risk: { icon: 'text-jm-red', bg: 'bg-jm-red/15', text: 'text-jm-red', label: 'Em risco' },
};

export function PostHire({ onBack }: PostHireProps) {
  const [selectedId, setSelectedId] = useState<string | null>(mockPostHireRecords[0]?.id ?? null);
  const selected = mockPostHireRecords.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para vagas
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pós-contratação</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe a jornada dos colaboradores nos primeiros 3 meses
        </p>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={Briefcase} label="Vagas fechadas" value={String(recruiterStats.closedJobs)} color="text-jm-purple" bg="bg-jm-purple/10" />
        <MetricCard icon={Clock} label="Tempo médio (dias)" value={String(recruiterStats.avgTimeToHire)} color="text-jm-teal" bg="bg-jm-teal/10" />
        <MetricCard icon={DollarSign} label="Custo médio/contratação" value={`R$ ${(recruiterStats.avgCostPerHire / 1000).toFixed(1)}k`} color="text-jm-orange" bg="bg-jm-orange/10" />
        <MetricCard icon={Coins} label="Tokens ganhos" value={`+${recruiterStats.totalTokensFromHires}`} color="text-jm-purple" bg="bg-jm-purple/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: list of hired people */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Contratações recentes
          </h2>
          {mockPostHireRecords.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card
                className={cn(
                  'border-border cursor-pointer transition-all',
                  selectedId === record.id
                    ? 'border-primary/40 bg-primary/5'
                    : 'hover:border-primary/20'
                )}
                onClick={() => setSelectedId(record.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className={cn(record.candidateAvatarColor, 'text-white font-bold text-sm')}>
                        {record.candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{record.candidateName}</div>
                      <div className="text-xs text-muted-foreground truncate">{record.jobTitle}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{record.currentPhase}</Badge>
                        <span className="text-[10px] text-muted-foreground">{record.daysSinceHire} dias</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={cn(
                            'h-3 w-3',
                            j < record.performanceRating ? 'fill-jm-purple text-jm-purple' : 'text-muted-foreground/30'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Right: detail of selected hire */}
        <div className="lg:col-span-2">
          {selected ? (
            <PostHireDetail record={selected} />
          ) : (
            <Card className="border-border">
              <CardContent className="p-10 text-center text-muted-foreground">
                Selecione uma contratação para ver os detalhes
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg }: { icon: typeof Clock; label: string; value: string; color: string; bg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
              <Icon className={cn('h-5 w-5', color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PostHireDetail({ record }: { record: PostHireRecord }) {
  return (
    <motion.div
      key={record.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header card */}
      <Card className="border-border overflow-hidden">
        <div className="bg-gradient-purple-teal-soft px-6 py-5 border-b border-border">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border-2 border-card shrink-0">
              <AvatarFallback className={cn(record.candidateAvatarColor, 'text-white font-bold')}>
                {record.candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold">{record.candidateName}</h2>
              <p className="text-sm text-muted-foreground">{record.jobTitle} · {record.company}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Contratado em {record.hireDate.split('-').reverse().join('/')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {record.daysSinceHire} dias na empresa
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Gestor: {record.manager}
                </span>
              </div>
            </div>
            <MatchScoreRing score={record.matchScore} size={56} strokeWidth={5} />
          </div>
        </div>

        {/* Progress + rating */}
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Onboarding</span>
                <span className="text-sm font-bold text-primary">{record.onboardingProgress}%</span>
              </div>
              <Progress value={record.onboardingProgress} className="h-2.5" />
              <p className="text-xs text-muted-foreground mt-2">
                {record.currentPhase === 'Confirmado'
                  ? 'Período de experiência finalizado'
                  : `Fase atual: ${record.currentPhase}`}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium block mb-2">Avaliação de desempenho</span>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={cn(
                      'h-6 w-6 transition-all',
                      j < record.performanceRating ? 'fill-jm-purple text-jm-purple' : 'text-muted-foreground/30'
                    )}
                  />
                ))}
                <span className="text-sm font-bold ml-2">{record.performanceRating}.0</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline of checkpoints */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Jornada de experiência (90 dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {record.checkpoints.map((cp, i) => (
            <CheckpointRow key={i} checkpoint={cp} isLast={i === record.checkpoints.length - 1} />
          ))}
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Feedbacks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {record.feedback.map((fb: PostHireFeedback, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{fb.author}</span>
                <span className="text-xs text-muted-foreground">{fb.date}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{fb.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CheckpointRow({ checkpoint, isLast }: { checkpoint: PostHireCheckpoint; isLast: boolean }) {
  const cfg = checkpointColors[checkpoint.status];
  const Icon = checkpointIcons[checkpoint.status];

  return (
    <div className="flex items-start gap-4">
      <div className="relative shrink-0">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cfg.bg)}>
          <Icon className={cn('h-5 w-5', cfg.icon)} />
        </div>
        {!isLast && (
          <div className="absolute left-1/2 -translate-x-1/2 top-10 w-0.5 h-full bg-border" />
        )}
      </div>
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{checkpoint.label}</span>
          <Badge variant="secondary" className={cn('text-[10px] border-0', cfg.bg, cfg.text)}>
            {cfg.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {checkpoint.date}
          </span>
          <span className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            {checkpoint.phase}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{checkpoint.notes}</p>
        {checkpoint.rating !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-muted-foreground mr-1">Avaliação:</span>
            {Array.from({ length: 5 }).map((_, j) => (
              <Star
                key={j}
                className={cn(
                  'h-3.5 w-3.5',
                  j < checkpoint.rating! ? 'fill-jm-teal text-jm-teal' : 'text-muted-foreground/30'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
