import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Info, ShieldCheck, Target } from 'lucide-react';
import type { Screen } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { focusPipelineOnJob } from '../features/applications/pipeline-focus';
import {
  MAX_POSTPONES_PER_STAGE,
  MAX_POSTPONE_DAYS_PICKER,
} from '../features/applications/batch-feedback';
import { GoalByJob } from '../features/feedback-goal/components/GoalByJob';
import { GoalPanel } from '../features/feedback-goal/components/GoalPanel';
import { DISCOUNT_PERCENT, GOAL_PERCENT, sumGoalRows } from '../features/feedback-goal/goal-rules';
import { useGoalAttainment } from '../features/feedback-goal/hooks';
import { useRecruiterJobs } from '../features/jobs/recruiter-jobs.hooks';
import { SLA_HOURS } from '../features/tokens/token-rules';

const SLA_DAYS = SLA_HOURS / 24;

const HIGHLIGHTS = [
  {
    icon: CalendarClock,
    title: `Retorno em até ${SLA_DAYS} dias`,
    text: 'Todo candidato ativo tem um prazo de retorno. Ele aparece em cada card do Pipeline e em "Minhas candidaturas".',
  },
  {
    icon: ShieldCheck,
    title: 'Mais tempo, sem sumir',
    text: `Se precisar de mais tempo, envie uma atualização com a nova data: até ${MAX_POSTPONES_PER_STAGE} adiamentos por etapa, com a nova data em até ${MAX_POSTPONE_DAYS_PICKER} dias.`,
  },
  {
    icon: Target,
    title: `Meta de ${GOAL_PERCENT}% no prazo`,
    text: `Cumprir a meta garante ${DISCOUNT_PERCENT}% de desconto na mensalidade (simulado durante o beta).`,
  },
];

const RULES = [
  'Mudar de etapa conta como contato: o candidato sempre fica sabendo.',
  'Ao dar um retorno de decisão, o prazo da etapa é cumprido e um novo prazo começa.',
  'Rejeitar sempre leva um motivo. No retorno em lote, o motivo é sugerido pelo que o candidato informou no perfil.',
  'O índice do mês conta os prazos já cumpridos e os que venceram sem retorno. Prazo aberto ainda dentro do prazo não entra na conta.',
];

interface TokensProps {
  onNavigate: (screen: Screen) => void;
}

// Tela "Retorno no prazo" (o arquivo ainda se chama Tokens por historico).
export function Tokens({ onNavigate }: TokensProps) {
  const goalQuery = useGoalAttainment();
  const jobsQuery = useRecruiterJobs();

  const rows = useMemo(() => goalQuery.data ?? [], [goalQuery.data]);
  const totals = useMemo(() => sumGoalRows(rows), [rows]);
  const jobTitles = useMemo(
    () =>
      Object.fromEntries((jobsQuery.data ?? []).map((job) => [job.id, job.title])) as Record<
        string,
        string
      >,
    [jobsQuery.data],
  );

  const openJob = (jobId: string) => {
    focusPipelineOnJob(jobId);
    onNavigate('pipeline');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Retorno no prazo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O candidato sempre sabe quando vai ter notícias. Aqui você acompanha a sua meta.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {goalQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Carregando o seu índice...</p>
        )}
        {goalQuery.isError && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">Não foi possível carregar o seu índice.</p>
            <Button variant="outline" size="sm" onClick={() => void goalQuery.refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}
        {goalQuery.isSuccess && (
          <>
            <GoalPanel totals={totals} />
            <GoalByJob rows={rows} jobTitles={jobTitles} onOpenJob={openJob} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        {HIGHLIGHTS.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border h-full">
              <CardContent className="p-5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-jm-teal/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-jm-teal" />
                </div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-primary" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            {RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
