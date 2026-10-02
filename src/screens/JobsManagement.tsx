import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Building2,
  MapPin,
  Briefcase,
  Coins,
  Users,
  UserPlus,
  MoreVertical,
  Eye,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { focusPipelineOnJob } from '../features/applications/pipeline-focus';
import { cn } from '@/lib/utils';
import { MatchScoreRing } from '@/components/MatchScoreRing';
import type { Job, PipelineCandidate } from '@/lib/types';
import type { Screen } from '@/components/Layout';

interface JobsManagementProps {
  jobs: Job[];
  jobCandidates: Record<string, PipelineCandidate[]>;
  onNewJob: () => void;
  onNavigate: (screen: Screen) => void;
  onToggleJobStatus: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
}

function statusConfig(status: Job['status']) {
  const map: Record<Job['status'], { color: string; bg: string; dot: string }> = {
    Ativa: { color: 'text-jm-teal', bg: 'bg-jm-teal/15', dot: 'bg-jm-teal' },
    Pausada: { color: 'text-jm-orange', bg: 'bg-jm-orange/15', dot: 'bg-jm-orange' },
    Rascunho: { color: 'text-muted-foreground', bg: 'bg-muted', dot: 'bg-muted-foreground' },
    Fechada: { color: 'text-muted-foreground', bg: 'bg-muted', dot: 'bg-muted-foreground/50' },
  };
  return map[status];
}

export function JobsManagement({
  jobs,
  jobCandidates,
  onNewJob,
  onNavigate,
  onToggleJobStatus,
  onDeleteJob,
}: JobsManagementProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'Ativa' | 'Pausada' | 'Rascunho' | 'Fechada'>('all');

  const filteredJobs = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vagas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie suas posições e acompanhe os candidatos
          </p>
        </div>
        <Button
          onClick={onNewJob}
          className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova vaga
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'Ativa', 'Pausada', 'Rascunho', 'Fechada'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              filter === f
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {f === 'all' ? 'Todas' : f}
          </button>
        ))}
      </div>

      {/* Job cards */}
      <div className="space-y-4">
        {filteredJobs.map((job, i) => {
          const cfg = statusConfig(job.status);
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="border-border hover:border-primary/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{job.title}</h3>
                        <Badge className={cn('shrink-0 border-0', cfg.bg, cfg.color)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full mr-1', cfg.dot)} />
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.company}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {job.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {job.salary}
                        </span>
                      </div>
                    </div>

                    {/* Stats mini-grid */}
                    <div className="grid grid-cols-3 gap-3 shrink-0 text-center">
                      <div>
                        <div className="text-lg font-bold">{job.candidatesCount}</div>
                        <div className="text-[10px] text-muted-foreground">candidatos</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-jm-orange">{job.newCandidatesCount}</div>
                        <div className="text-[10px] text-muted-foreground">novas</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-jm-purple">{job.interviewCount}</div>
                        <div className="text-[10px] text-muted-foreground">entrevistas</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 relative">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedJob(job)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Ver candidatos
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setMenuOpen(menuOpen === job.id ? null : job.id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {menuOpen === job.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-border bg-popover shadow-lg py-1">
                            <button
                              onClick={() => {
                                onToggleJobStatus(job.id);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4 text-jm-teal" />
                              {job.status === 'Ativa' ? 'Pausar vaga' : 'Ativar vaga'}
                            </button>
                            <button
                              onClick={() => {
                                onDeleteJob(job.id);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 text-destructive flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir vaga
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Closed job hire metrics */}
                  {job.status === 'Fechada' && job.hire && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', job.hire.candidateAvatarColor)}>
                          {job.hire.candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{job.hire.candidateName}</span>
                          <span className="text-xs text-muted-foreground ml-2">foi contratado(a)</span>
                        </div>
                        <Badge className="bg-jm-teal/15 text-jm-teal border-0 shrink-0">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Fechada
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-2.5 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                            <Clock className="h-3 w-3" />
                            Tempo de contratação
                          </div>
                          <div className="text-sm font-bold">{job.hire.timeToHireDays} dias</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                            <DollarSign className="h-3 w-3" />
                            Custo por contratação
                          </div>
                          <div className="text-sm font-bold">R$ {job.hire.costPerHire.toLocaleString('pt-BR')}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                            <Coins className="h-3 w-3" />
                            Salário negociado
                          </div>
                          <div className="text-sm font-bold">{job.hire.salaryNegotiated}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                            <ArrowRight className="h-3 w-3" />
                            Tokens ganhos
                          </div>
                          <div className="text-sm font-bold text-jm-teal">+{job.hire.tokensEarned}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => onNavigate('post-hire')}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Ver jornada pós-contratação
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Nenhuma vaga {filter !== 'all' ? filter.toLowerCase() : ''}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie uma nova vaga para começar a receber candidatos.
            </p>
            <Button
              onClick={onNewJob}
              className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar vaga
            </Button>
          </div>
        )}
      </div>

      {/* Job candidates modal */}
      <JobCandidatesModal
        job={selectedJob}
        candidates={selectedJob ? jobCandidates[selectedJob.id] || [] : []}
        onClose={() => setSelectedJob(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function JobCandidatesModal({
  job,
  candidates,
  onClose,
  onNavigate,
}: {
  job: Job | null;
  candidates: PipelineCandidate[];
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
}) {
  if (!job) return null;

  const sorted = [...candidates].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <Dialog open={!!job} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Candidatos - {job.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Job summary */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-purple-teal-soft">
            <div className="flex-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{candidates.length} candidatos</span>
                <span>{job.newCandidatesCount} novas</span>
                <span>{job.interviewCount} entrevistas</span>
              </div>
            </div>
          </div>

          {/* Candidates list */}
          {sorted.length > 0 ? (
            <div className="space-y-2">
              {sorted.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 transition-colors"
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                      candidate.avatarColor
                    )}
                  >
                    {candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{candidate.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {candidate.role} · {candidate.seniority}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {candidate.stage}
                  </Badge>
                  <MatchScoreRing score={candidate.matchScore} size={44} strokeWidth={4} />
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  onClose();
                  focusPipelineOnJob(job.id);
                  onNavigate('pipeline');
                }}
              >
                Ver pipeline completo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <UserPlus className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Esta vaga ainda não recebeu candidatos.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
