import { motion } from 'framer-motion';
import { MatchScoreRing } from '@/components/MatchScoreRing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Building2,
  Coins,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Heart,
  Share2,
} from 'lucide-react';
import type { Job, SkillRequirement } from '@/lib/types';
import { cn } from '@/lib/utils';

interface JobDetailProps {
  job: Job;
  onBack: () => void;
  onApply: (job: Job) => void;
  alreadyApplied?: boolean;
}

function SkillDetail({ skill }: { skill: SkillRequirement }) {
  const status =
    skill.candidateLevel === 0
      ? 'missing'
      : skill.candidateLevel >= skill.level
        ? 'match'
        : 'gap';

  const config = {
    match: { icon: CheckCircle2, color: 'text-jm-teal', bg: 'bg-jm-teal/10', label: 'Compatível' },
    gap: { icon: AlertTriangle, color: 'text-jm-orange', bg: 'bg-jm-orange/10', label: 'Gap' },
    missing: { icon: XCircle, color: 'text-jm-red', bg: 'bg-jm-red/10', label: 'Ausente' },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className={cn('flex items-center gap-3 rounded-xl px-4 py-3', c.bg)}>
      <Icon className={cn('h-5 w-5 shrink-0', c.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{skill.name}</span>
          {skill.mandatory && (
            <Badge variant="destructive" className="text-[10px]">Obrigatória</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Exigido nível {skill.level}{' '}
          {skill.candidateLevel > 0
            ? `· Você tem nível ${skill.candidateLevel}`
            : '· Você não cadastrou esta skill'}
        </div>
        {/* Level bars */}
        <div className="flex gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                i < skill.level ? 'bg-foreground/30' : 'bg-foreground/10'
              )}
            />
          ))}
          <div className="w-2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                i < skill.candidateLevel
                  ? status === 'match'
                    ? 'bg-jm-teal'
                    : status === 'gap'
                      ? 'bg-jm-orange'
                      : 'bg-jm-red'
                  : 'bg-foreground/10'
              )}
            />
          ))}
        </div>
      </div>
      <span className={cn('text-xs font-semibold shrink-0', c.color)}>{c.label}</span>
    </div>
  );
}

export function JobDetail({ job, onBack, onApply, alreadyApplied }: JobDetailProps) {
  const matchSkills = job.skills.filter((s) => s.candidateLevel >= s.level).length;
  const gapSkills = job.skills.filter((s) => s.candidateLevel > 0 && s.candidateLevel < s.level).length;
  const missingSkills = job.skills.filter((s) => s.candidateLevel === 0).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para vagas
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header card */}
        <Card className="border-border overflow-hidden mb-6">
          <div className="bg-gradient-purple-teal-soft px-6 py-6 border-b border-border">
            <div className="flex items-start gap-6">
              <MatchScoreRing score={job.matchScore} size={88} strokeWidth={7} />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">{job.title}</h1>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{job.company}</span>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
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
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {job.posted}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {job.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Sobre a vaga</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
          </CardContent>
        </Card>

        {/* Match analysis */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Análise de compatibilidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-jm-teal/10 px-4 py-3 text-center">
                <div className="text-2xl font-bold text-jm-teal">{matchSkills}</div>
                <div className="text-xs text-muted-foreground">compatíveis</div>
              </div>
              <div className="rounded-xl bg-jm-orange/10 px-4 py-3 text-center">
                <div className="text-2xl font-bold text-jm-orange">{gapSkills}</div>
                <div className="text-xs text-muted-foreground">gaps</div>
              </div>
              <div className="rounded-xl bg-jm-red/10 px-4 py-3 text-center">
                <div className="text-2xl font-bold text-jm-red">{missingSkills}</div>
                <div className="text-xs text-muted-foreground">ausentes</div>
              </div>
            </div>

            <Separator />

            {/* Skills detail */}
            <div className="space-y-2">
              {job.skills.map((skill, i) => (
                <SkillDetail key={i} skill={skill} />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  <div className="h-1.5 w-3 rounded-full bg-foreground/30" />
                  <div className="h-1.5 w-3 rounded-full bg-foreground/30" />
                </div>
                Exigido · Você
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action bar */}
        <div className="sticky bottom-4">
          <Card className="border-border p-4 backdrop-blur-lg bg-card/90">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="shrink-0">
                <Share2 className="h-4 w-4" />
              </Button>
              {alreadyApplied ? (
                <Button disabled className="flex-1" variant="secondary">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-jm-teal" />
                  Candidatura enviada
                </Button>
              ) : (
                <Button
                  onClick={() => onApply(job)}
                  className="flex-1 bg-gradient-purple-teal text-white border-0 hover:opacity-90"
                  size="lg"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Candidatar-se agora
                </Button>
              )}
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
