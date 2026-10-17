import { Target } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';
import {
  GOAL_PERCENT,
  summarizeGoal,
  type GoalTotals,
} from '../goal-rules';

interface GoalPanelProps {
  totals: GoalTotals;
  className?: string;
}

const STATE_COLOR = {
  empty: 'text-muted-foreground',
  reached: 'text-jm-teal',
  missing: 'text-jm-orange',
} as const;

const BAR_COLOR = {
  empty: 'bg-muted-foreground/40',
  reached: 'bg-jm-teal',
  missing: 'bg-jm-orange',
} as const;

// Painel do indice de retorno no prazo do mes: percentual, barra ate a meta e o
// desconto simulado que o indice garantiria.
export function GoalPanel({ totals, className }: GoalPanelProps) {
  const summary = summarizeGoal(totals);
  const percent = summary.percent ?? 0;

  return (
    <Card className={cn('border-border', className)}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Target className="h-4 w-4" aria-hidden="true" />
          Retorno no prazo neste mês
        </div>

        <div className="flex items-end gap-3">
          <div className={cn('text-4xl font-bold', STATE_COLOR[summary.state])}>
            {summary.percent === null ? '—' : `${summary.percent}%`}
          </div>
          <div className="text-sm text-muted-foreground pb-1">
            {summary.percent === null
              ? `Meta: ${GOAL_PERCENT}%`
              : `${totals.onTime} de ${totals.total} no prazo · Meta: ${GOAL_PERCENT}%`}
          </div>
        </div>

        <div
          className="relative h-2 w-full rounded-full bg-muted"
          role="progressbar"
          aria-label="Retorno no prazo neste mês"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className={cn('h-2 rounded-full', BAR_COLOR[summary.state])}
            style={{ width: `${percent}%` }}
          />
          <div
            className="absolute top-[-3px] h-[14px] w-[2px] bg-foreground/70"
            style={{ left: `${GOAL_PERCENT}%` }}
            aria-hidden="true"
          />
        </div>

        <p className="text-sm font-medium">{summary.message}</p>
        <p className="text-xs text-muted-foreground">
          Desconto simulado durante o beta. A cobrança com desconto real começa depois.
        </p>
      </CardContent>
    </Card>
  );
}
