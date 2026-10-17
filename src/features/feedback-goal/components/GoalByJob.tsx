import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  GOAL_PERCENT,
  goalReached,
  percentOnTime,
  sortRowsWorstFirst,
  type GoalRow,
} from '../goal-rules';

interface GoalByJobProps {
  rows: readonly GoalRow[];
  jobTitles: Readonly<Record<string, string>>;
  onOpenJob: (jobId: string) => void;
}

// Indice por vaga, do pior para o melhor. Tela privada da recrutadora: serve
// para agir, por isso cada vaga leva ao Pipeline.
export function GoalByJob({ rows, jobTitles, onOpenJob }: GoalByJobProps) {
  const sorted = sortRowsWorstFirst(rows);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Por vaga</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Quando houver retornos com prazo neste mês, o índice de cada vaga aparece aqui.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((row) => {
              const reached = goalReached(row.total, row.on_time);
              return (
                <li
                  key={row.job_id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {jobTitles[row.job_id] ?? 'Vaga'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.on_time} de {row.total} no prazo ·{' '}
                      {reached ? `meta de ${GOAL_PERCENT}% atingida` : `meta de ${GOAL_PERCENT}%`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        reached ? 'font-semibold text-jm-teal' : 'font-semibold text-jm-orange'
                      }
                    >
                      {percentOnTime(row.total, row.on_time)}%
                    </span>
                    <Button variant="outline" size="sm" onClick={() => onOpenJob(row.job_id)}>
                      Ver no Pipeline
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
