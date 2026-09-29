import { useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { MatchScoreRing } from '@/components/MatchScoreRing';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Heart,
  X,
  Info,
  MapPin,
  Briefcase,
  Building2,
  Coins,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { mockJobs } from '@/lib/mock-data';
import type { Job, SkillRequirement } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SwipeProps {
  onApply: (job: Job) => void;
  onDetail: (job: Job) => void;
}

function SkillRow({ skill }: { skill: SkillRequirement }) {
  const status =
    skill.candidateLevel === 0
      ? 'missing'
      : skill.candidateLevel >= skill.level
        ? 'match'
        : 'gap';

  const config = {
    match: {
      icon: CheckCircle2,
      color: 'text-jm-teal',
      bg: 'bg-jm-teal/10',
      label: 'Compatível',
    },
    gap: {
      icon: AlertTriangle,
      color: 'text-jm-orange',
      bg: 'bg-jm-orange/10',
      label: 'Gap',
    },
    missing: {
      icon: XCircle,
      color: 'text-jm-red',
      bg: 'bg-jm-red/10',
      label: 'Ausente',
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2', c.bg)}>
      <Icon className={cn('h-4 w-4 shrink-0', c.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{skill.name}</span>
          {skill.mandatory && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-medium">
              Obrigatória
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Exigido: {skill.level} {skill.candidateLevel > 0 && `· Você: ${skill.candidateLevel}`}
          {skill.candidateLevel === 0 && ' · Você não tem'}
        </div>
      </div>
      <span className={cn('text-xs font-semibold', c.color)}>{c.label}</span>
    </div>
  );
}

function JobCard({
  job,
  onSwipe,
  onDetail,
  isTop,
  index,
}: {
  job: Job;
  onSwipe: (direction: 'left' | 'right') => void;
  onDetail: () => void;
  isTop: boolean;
  index: number;
}) {
  const [exitX, setExitX] = useState(0);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) {
      setExitX(1000);
      onSwipe('right');
    } else if (info.offset.x < -120) {
      setExitX(-1000);
      onSwipe('left');
    }
  };

  const matchSkills = job.skills.filter((s) => s.candidateLevel >= s.level).length;
  const gapSkills = job.skills.filter((s) => s.candidateLevel > 0 && s.candidateLevel < s.level).length;
  const missingSkills = job.skills.filter((s) => s.candidateLevel === 0).length;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1, opacity: 0 }}
      animate={{
        scale: isTop ? 1 : 1 - index * 0.04,
        opacity: 1,
        y: index * 12,
      }}
      exit={{ x: exitX, opacity: 0, transition: { duration: 0.3 } }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{ zIndex: 10 - index }}
    >
      <Card className="h-full overflow-hidden border-border shadow-2xl cursor-grab active:cursor-grabbing">
        <div className="h-full flex flex-col">
          {/* Score header */}
          <div className="relative bg-gradient-purple-teal-soft px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate">{job.title}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {job.company}
                </div>
              </div>
              <MatchScoreRing score={job.matchScore} size={72} />
            </div>

            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                {job.type}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Coins className="h-3.5 w-3.5" />
                {job.salary}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {job.description}
            </p>

            {/* Skill summary */}
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold">Análise de compatibilidade</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Como calculamos o Match Score
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-jm-teal" />
                      <span>Compatível: você atende ao nível exigido</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5 text-jm-orange" />
                      <span>Gap: você tem a skill mas abaixo do nível</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <XCircle className="h-3.5 w-3.5 text-jm-red" />
                      <span>Ausente: você não cadastrou esta skill</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-lg bg-jm-teal/10 px-3 py-2 text-center">
                <div className="text-lg font-bold text-jm-teal">{matchSkills}</div>
                <div className="text-[10px] text-muted-foreground">compatíveis</div>
              </div>
              <div className="rounded-lg bg-jm-orange/10 px-3 py-2 text-center">
                <div className="text-lg font-bold text-jm-orange">{gapSkills}</div>
                <div className="text-[10px] text-muted-foreground">gaps</div>
              </div>
              <div className="rounded-lg bg-jm-red/10 px-3 py-2 text-center">
                <div className="text-lg font-bold text-jm-red">{missingSkills}</div>
                <div className="text-[10px] text-muted-foreground">ausentes</div>
              </div>
            </div>

            {/* Skills list */}
            <div className="space-y-2">
              {job.skills.map((skill, i) => (
                <SkillRow key={i} skill={skill} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-border">
            <button
              onClick={onDetail}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver detalhes completos
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function Swipe({ onApply, onDetail }: SwipeProps) {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right' && jobs[0]) {
      setAppliedJobs((prev) => new Set(prev).add(jobs[0].id));
    }
    setJobs((prev) => prev.slice(1));
  };

  const handleApply = () => {
    if (jobs[0]) {
      setAppliedJobs((prev) => new Set(prev).add(jobs[0].id));
      onApply(jobs[0]);
      setJobs((prev) => prev.slice(1));
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Vagas para você</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Arraste para o lado ou use os botões
        </p>
      </div>

      {/* Card stack */}
      <div className="relative h-[560px] mb-6">
        <AnimatePresence>
          {jobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Você viu todas as vagas!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {appliedJobs.size > 0
                  ? `Você se candidatou a ${appliedJobs.size} vaga${appliedJobs.size > 1 ? 's' : ''}.`
                  : 'Volte mais tarde para novas oportunidades.'}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setJobs(mockJobs);
                  setAppliedJobs(new Set());
                }}
              >
                Ver vagas novamente
              </Button>
            </motion.div>
          ) : (
            jobs
              .slice(0, 3)
              .map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSwipe={handleSwipe}
                  onDetail={() => onDetail(job)}
                  isTop={index === 0}
                  index={index}
                />
              ))
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      {jobs.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleSwipe('left')}
            className="h-14 w-14 rounded-full border-2 border-destructive/30 hover:border-destructive hover:bg-destructive/10 group"
          >
            <X className="h-6 w-6 text-destructive group-hover:scale-110 transition-transform" />
          </Button>
          <Button
            size="icon"
            onClick={handleApply}
            className="h-16 w-16 rounded-full bg-gradient-purple-teal border-0 hover:opacity-90 shadow-lg group"
          >
            <Heart className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => onDetail(jobs[0])}
            className="h-14 w-14 rounded-full border-2 border-primary/30 hover:border-primary hover:bg-primary/10 group"
          >
            <Info className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      )}

      {/* Swipe hints */}
      <div className="flex items-center justify-between mt-4 px-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <X className="h-3 w-3 text-destructive" />
          Arraste esquerda para pular
        </span>
        <span className="flex items-center gap-1">
          Arraste direita para candidatar
          <Heart className="h-3 w-3 text-primary" />
        </span>
      </div>
    </div>
  );
}
