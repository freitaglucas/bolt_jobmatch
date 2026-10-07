import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Briefcase, Calendar, Clock, MapPin } from 'lucide-react';
import {
  DEADLINE_TONE_CLASSES,
  getStageDeadline,
} from '../features/applications/stage-deadline';
import { MatchScoreRing } from '@/components/MatchScoreRing';
import { Textarea } from '@/components/ui/textarea';
import type { ApplicationStatus, PipelineCandidate } from '@/lib/types';
import { cn } from '@/lib/utils';
import { mapRecruiterApplication } from '@/features/applications/recruiter-applications';
import {
  useMoveApplicationStage,
  useRecruiterApplications,
  useSendApplicationFeedback,
} from '@/features/applications/recruiter-applications.hooks';
import {
  FEEDBACK_MAX_LENGTH,
  validateFeedback,
} from '@/features/applications/feedback-rules';
import {
  canReject,
  getNextStage,
} from '@/features/applications/pipeline-transitions';
import {
  clearPipelineFocus,
  peekPipelineFocus,
} from '@/features/applications/pipeline-focus';
import {
  ALL_JOBS,
  buildPipelineColumns,
  filterCandidatesByJob,
} from '@/features/applications/pipeline-view';
import { useRecruiterJobs } from '@/features/jobs/recruiter-jobs.hooks';

const JOB_STATUS_SUFFIX: Record<string, string> = {
  draft: ' (rascunho)',
  paused: ' (pausada)',
  closed: ' (fechada)',
};

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function experienceLabel(years: number | null | undefined): string {
  if (years === null || years === undefined) {
    return 'Experiência não informada';
  }
  return years === 1 ? '1 ano de experiência' : `${years} anos de experiência`;
}

export function Pipeline() {
  const applicationsQuery = useRecruiterApplications();
  const jobsQuery = useRecruiterJobs();
  const [selectedJobId, setSelectedJobId] = useState<string>(
    () => peekPipelineFocus() ?? ALL_JOBS,
  );
  const [selectedCandidate, setSelectedCandidate] =
    useState<PipelineCandidate | null>(null);

  useEffect(() => {
    return () => {
      clearPipelineFocus();
    };
  }, []);

  const candidates = useMemo(
    () =>
      (applicationsQuery.data ?? []).flatMap((row) => {
        const candidate = mapRecruiterApplication(row);
        return candidate ? [candidate] : [];
      }),
    [applicationsQuery.data],
  );

  const jobs = jobsQuery.data ?? [];
  const activeJobId =
    selectedJobId === ALL_JOBS || jobs.some((job) => job.id === selectedJobId)
      ? selectedJobId
      : ALL_JOBS;

  const visibleCandidates = useMemo(
    () => filterCandidatesByJob(candidates, activeJobId),
    [candidates, activeJobId],
  );
  const columns = useMemo(
    () => buildPipelineColumns(visibleCandidates),
    [visibleCandidates],
  );

  if (applicationsQuery.isLoading || jobsQuery.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-sm text-muted-foreground">
        Carregando candidaturas...
      </div>
    );
  }

  if (applicationsQuery.isError || jobsQuery.isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-3">
        <p className="text-sm text-destructive">
          Não foi possível carregar as candidaturas.
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

  const showJobTitle = activeJobId === ALL_JOBS;
  const total = visibleCandidates.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de candidatos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe as candidaturas por etapa, do maior para o menor match
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <select
            aria-label="Filtrar por vaga"
            value={activeJobId}
            onChange={(event) => setSelectedJobId(event.target.value)}
            className="w-full sm:w-72 rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value={ALL_JOBS} className="bg-background">
              Todas as vagas
            </option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id} className="bg-background">
                {job.title}
                {JOB_STATUS_SUFFIX[job.status] ?? ''}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {total === 1 ? '1 candidatura' : `${total} candidaturas`}
          </span>
        </div>
      </div>

      {candidates.length === 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          Nenhuma candidatura recebida ainda.
        </p>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => (
            <div key={column.stage} className="w-72 shrink-0">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-3 border border-border bg-card/50">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', column.color)} />
                  <span className="font-semibold text-sm">{column.stage}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {column.candidates.length}
                </Badge>
              </div>

              <div className="space-y-3 min-h-[200px]">
                {column.candidates.map((candidate) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCandidate(candidate)}
                      className="w-full text-left"
                    >
                      <Card className="border-border hover:border-primary/30 transition-all">
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                                candidate.avatarColor,
                              )}
                            >
                              {initials(candidate.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {candidate.name}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {candidate.role}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {candidate.seniority}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {candidate.appliedDate}
                                </span>
                              </div>
                            </div>
                          </div>

                          {(() => {
                            const deadline = getStageDeadline({
                              stage: candidate.stage,
                              lastStageChangeAt: candidate.lastStageChangeAt,
                              respondedAt: candidate.feedbackSentAt,
                              now: new Date(),
                            });
                            return deadline ? (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-[10px] font-medium',
                                  DEADLINE_TONE_CLASSES[deadline.tone],
                                )}
                              >
                                <Clock className="h-3 w-3" />
                                {deadline.label}
                              </span>
                            ) : null;
                          })()}

                          {showJobTitle && candidate.jobTitle && (
                            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                              <Briefcase className="h-3 w-3 shrink-0" />
                              <span className="truncate">{candidate.jobTitle}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <MatchScoreRing
                              score={candidate.matchScore}
                              size={40}
                              strokeWidth={4}
                            />
                            <span className="text-xs text-muted-foreground">
                              Ver detalhes
                            </span>
                          </div>
                        </div>
                      </Card>
                    </button>
                  </motion.div>
                ))}

                {column.candidates.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Nenhum candidato
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}

function CandidateModal({
  candidate,
  onClose,
}: {
  candidate: PipelineCandidate | null;
  onClose: () => void;
}) {
  const moveStage = useMoveApplicationStage();
  const sendFeedback = useSendApplicationFeedback();
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ao trocar de candidato, zera o texto digitado e a confirmacao.
  useEffect(() => {
    setConfirmingReject(false);
    setFeedbackText('');
    setErrorMessage(null);
  }, [candidate]);

  if (!candidate) return null;

  const candidateId = candidate.id;
  const nextStage = getNextStage(candidate.stage);
  const isPending = moveStage.isPending || sendFeedback.isPending;

  // Rejeitar exige feedback; avancar de etapa, nao. Havendo texto, ele e
  // enviado ANTES de mover a candidatura: se o envio falhar, a etapa nao muda.
  function handleStageChange(targetStage: ApplicationStatus) {
    const validationError = validateFeedback(feedbackText, targetStage);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage(null);

    const advance = () =>
      moveStage.mutate(
        { applicationId: candidateId, stage: targetStage },
        {
          onSuccess: () => onClose(),
          onError: () =>
            setErrorMessage('Não foi possível mover a candidatura. Tente de novo.'),
        },
      );

    const content = feedbackText.trim();
    if (content.length === 0) {
      advance();
      return;
    }

    sendFeedback.mutate(
      { applicationId: candidateId, content },
      {
        onSuccess: advance,
        onError: () =>
          setErrorMessage(
            'Não foi possível enviar o feedback. A etapa não foi alterada.',
          ),
      },
    );
  }

  return (
    <Dialog open={!!candidate} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className={cn(candidate.avatarColor, 'text-white font-bold')}>
                {initials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div>{candidate.name}</div>
              <p className="text-sm font-normal text-muted-foreground">
                {candidate.role} · {candidate.seniority}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-purple-teal-soft">
            <MatchScoreRing score={candidate.matchScore} size={72} strokeWidth={6} />
            <div className="flex-1 min-w-0 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {candidate.location || 'Local não informado'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                {experienceLabel(candidate.yearsOfExperience)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Candidatura em {candidate.appliedDate}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {candidate.jobTitle && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Vaga</span>
                <span className="font-medium text-right">{candidate.jobTitle}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Etapa atual</span>
              <Badge variant="secondary">{candidate.stage}</Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="candidate-feedback" className="text-sm font-medium">
              Feedback para o candidato
            </label>
            <Textarea
              id="candidate-feedback"
              value={feedbackText}
              maxLength={FEEDBACK_MAX_LENGTH}
              placeholder="Conte o que pesou na decisão. Obrigatório ao rejeitar."
              onChange={(event) => setFeedbackText(event.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {feedbackText.length}/{FEEDBACK_MAX_LENGTH}
            </p>
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          {nextStage && (
            <Button
              className="w-full"
              disabled={isPending}
              onClick={() => handleStageChange(nextStage)}
            >
              Avançar para {nextStage}
            </Button>
          )}

          {canReject(candidate.stage) &&
            (confirmingReject ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Rejeitar esta candidatura?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => handleStageChange('Rejeitado')}
                  >
                    Confirmar rejeição
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmingReject(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setConfirmingReject(true)}
              >
                Rejeitar
              </Button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
