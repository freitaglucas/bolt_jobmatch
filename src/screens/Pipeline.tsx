import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  GripVertical,
  Mail,
  MapPin,
  Briefcase,
  TrendingUp,
  Award,
  MessageSquare,
} from 'lucide-react';
import { MatchScoreRing } from '@/components/MatchScoreRing';
import { mockPipelineCandidates, pipelineColumns } from '@/lib/mock-data';
import type { PipelineCandidate, ApplicationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const stages = pipelineColumns.map((c) => c.stage) as ApplicationStatus[];

export function Pipeline() {
  const [candidates, setCandidates] = useState(mockPipelineCandidates);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);

  const handleDrop = (stage: ApplicationStatus) => {
    if (!draggedId) return;
    setCandidates((prev) =>
      prev.map((c) => (c.id === draggedId ? { ...c, stage } : c))
    );
    setDraggedId(null);
    setDragOverStage(null);
  };

  const moveCandidate = (id: string, direction: 'forward' | 'backward') => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const currentIdx = stages.indexOf(c.stage);
        const newIdx =
          direction === 'forward'
            ? Math.min(currentIdx + 1, stages.length - 1)
            : Math.max(currentIdx - 1, 0);
        return { ...c, stage: stages[newIdx] };
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pipeline de candidatos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Arraste os cards entre as colunas ou use as setas
        </p>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {pipelineColumns.map((col) => {
            const colCandidates = candidates.filter((c) => c.stage === col.stage);
            return (
              <div
                key={col.stage}
                className="w-72 shrink-0"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(col.stage);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={() => handleDrop(col.stage as ApplicationStatus)}
              >
                {/* Column header */}
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl mb-3 border transition-all',
                    dragOverStage === col.stage
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full', col.color)} />
                    <span className="font-semibold text-sm">{col.stage}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {colCandidates.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-[200px]">
                  <AnimatePresence>
                    {colCandidates.map((candidate) => (
                      <motion.div
                        key={candidate.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        draggable
                        onDragStart={() => setDraggedId(candidate.id)}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setDragOverStage(null);
                        }}
                        onClick={() => setSelectedCandidate(candidate)}
                        className={cn(
                          'cursor-grab active:cursor-grabbing transition-opacity',
                          draggedId === candidate.id && 'opacity-40'
                        )}
                      >
                        <Card className="border-border hover:border-primary/30 transition-all group">
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                                  candidate.avatarColor
                                )}
                              >
                                {candidate.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)}
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
                              <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                              <MatchScoreRing
                                score={candidate.matchScore}
                                size={40}
                                strokeWidth={4}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveCandidate(candidate.id, 'backward');
                                  }}
                                  disabled={candidate.stage === stages[0]}
                                >
                                  <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveCandidate(candidate.id, 'forward');
                                  }}
                                  disabled={candidate.stage === stages[stages.length - 1]}
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {colCandidates.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      Solte candidatos aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate detail modal */}
      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onMove={(direction) => {
          if (selectedCandidate) {
            moveCandidate(selectedCandidate.id, direction);
            setSelectedCandidate(null);
          }
        }}
      />
    </div>
  );
}

function CandidateModal({
  candidate,
  onClose,
  onMove,
}: {
  candidate: PipelineCandidate | null;
  onClose: () => void;
  onMove: (direction: 'forward' | 'backward') => void;
}) {
  if (!candidate) return null;

  const currentIdx = stages.indexOf(candidate.stage);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === stages.length - 1;

  const mockSkills = [
    { name: 'Inovação Aberta', level: 4 },
    { name: 'Gestão de Projetos', level: 4 },
    { name: 'Negociação', level: 3 },
    { name: 'Metodologias Ágeis', level: 4 },
  ];

  const timeline = stages.slice(0, currentIdx + 1).map((stage, i) => ({
    label: stage,
    done: i < currentIdx,
    current: i === currentIdx,
  }));

  return (
    <Dialog open={!!candidate} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className={cn(candidate.avatarColor, 'text-white font-bold')}>
                {candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
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
          {/* Score + info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-purple-teal-soft">
            <MatchScoreRing score={candidate.matchScore} size={72} strokeWidth={6} />
            <div className="flex-1 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                São Paulo, SP
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                5 anos de experiência
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {candidate.name.toLowerCase().replace(' ', '.')}@email.com
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" />
              Competências principais
            </h4>
            <div className="space-y-2">
              {mockSkills.map((skill) => (
                <div key={skill.name} className="flex items-center gap-3">
                  <span className="text-sm flex-1">{skill.name}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1.5 w-6 rounded-full',
                          i < skill.level
                            ? skill.level >= 4
                              ? 'bg-jm-purple'
                              : 'bg-jm-teal'
                            : 'bg-muted'
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              Etapas do processo
            </h4>
            <div className="space-y-2">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                      step.done
                        ? 'bg-jm-teal/15'
                        : step.current
                          ? 'bg-primary/15'
                          : 'bg-muted'
                    )}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-jm-teal" />
                    ) : step.current ? (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm',
                      step.current ? 'font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs font-semibold flex items-center gap-1.5 mb-1">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              Feedback
            </p>
            <p className="text-sm text-muted-foreground">
              {candidate.matchScore >= 80
                ? 'Excelente fit com a vaga. Recomendamos avançar para próxima etapa.'
                : candidate.matchScore >= 60
                  ? 'Bom potencial, mas alguns gaps a avaliar na entrevista.'
                  : 'Fit parcial. Avaliar se gaps são bloqueantes para a vaga.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onMove('backward')}
              disabled={isFirst}
            >
              <ArrowRight className="h-4 w-4 rotate-180 mr-1" />
              Voltar etapa
            </Button>
            <Button
              className="flex-1 bg-gradient-purple-teal text-white border-0 hover:opacity-90"
              onClick={() => onMove('forward')}
              disabled={isLast}
            >
              Avançar
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onClose}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar candidato
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
