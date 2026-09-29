import { motion } from 'framer-motion';
import { MatchScoreRing } from '@/components/MatchScoreRing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar,
  MessageSquare,
  Check,
} from 'lucide-react';
import { mockApplications } from '@/lib/mock-data';
import type { Application, ApplicationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

function statusConfig(status: ApplicationStatus) {
  const config: Record<ApplicationStatus, { color: string; bg: string; icon: typeof Clock }> = {
    'Em análise': { color: 'text-slate-400', bg: 'bg-slate-500/15', icon: Clock },
    'Triagem': { color: 'text-blue-400', bg: 'bg-blue-500/15', icon: FileText },
    'Entrevista': { color: 'text-jm-purple', bg: 'bg-jm-purple/15', icon: MessageSquare },
    'Final': { color: 'text-jm-orange', bg: 'bg-jm-orange/15', icon: Calendar },
    'Aprovado': { color: 'text-jm-teal', bg: 'bg-jm-teal/15', icon: CheckCircle2 },
    'Rejeitado': { color: 'text-jm-red', bg: 'bg-jm-red/15', icon: XCircle },
  };
  return config[status];
}

function Timeline({ application }: { application: Application }) {
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h4 className="text-sm font-semibold mb-3">Linha do tempo</h4>
      <div className="space-y-3">
        {application.timeline.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="relative">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  step.done ? 'bg-jm-teal/15' : 'bg-muted'
                )}
              >
                {step.done ? (
                  <Check className="h-3.5 w-3.5 text-jm-teal" />
                ) : (
                  <Clock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              {i < application.timeline.length - 1 && (
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 top-7 w-0.5 h-6',
                    step.done ? 'bg-jm-teal/30' : 'bg-muted'
                  )}
                />
              )}
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className={cn('text-sm', step.done ? 'text-foreground' : 'text-muted-foreground')}>
                  {step.label}
                </span>
                <span className="text-xs text-muted-foreground">{step.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {application.feedback && (
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs font-semibold text-primary mb-1">Feedback do recrutador</p>
          <p className="text-sm text-muted-foreground">{application.feedback}</p>
        </div>
      )}
    </div>
  );
}

export function Applications() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Minhas candidaturas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe o status de cada vaga em tempo real
        </p>
      </div>

      <div className="space-y-4">
        {mockApplications.map((app, i) => {
          const cfg = statusConfig(app.status);
          const StatusIcon = cfg.icon;

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border hover:border-primary/20 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <MatchScoreRing score={app.matchScore} size={64} strokeWidth={5} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{app.jobTitle}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {app.company}
                          </div>
                        </div>
                        <Badge className={cn('shrink-0', cfg.bg, cfg.color, 'border-0')}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {app.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Candidatado em {app.appliedDate.split('-').reverse().join('/')}
                        </span>
                      </div>

                      <Timeline application={app} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {mockApplications.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Você ainda não se candidatou a nenhuma vaga.</p>
          <Button className="mt-4 bg-gradient-purple-teal text-white border-0">
            Explorar vagas
          </Button>
        </div>
      )}
    </div>
  );
}
