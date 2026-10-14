import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import type { Job, PipelineCandidate } from '../../../lib/types';
import { summarizeOutcomes, type BatchOutcome } from '../../applications/batch-feedback';
import { useCloseJob } from '../close-job.hooks';
import { buildCloseJobPlan, pendingCandidates } from '../close-job';

interface CloseJobDialogProps {
  job: Job;
  // Todas as candidaturas da vaga (a tela filtra quem ainda aguarda retorno).
  candidates: PipelineCandidate[];
  onCancel: () => void;
  // Chamado ao fechar a janela depois de uma tentativa (a lista de vagas ja foi atualizada).
  onFinished: () => void;
  // Para dar retorno com outros motivos, por candidato, no Pipeline da vaga.
  onOpenPipeline: () => void;
}

const NAMES_SHOWN = 5;

function plural(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

export function CloseJobDialog({
  job,
  candidates,
  onCancel,
  onFinished,
  onOpenPipeline,
}: CloseJobDialogProps) {
  const pending = useMemo(() => pendingCandidates(candidates), [candidates]);
  const plan = useMemo(() => buildCloseJobPlan(pending, new Date()), [pending]);
  const mutation = useCloseJob(job.id);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{
    closed: boolean;
    message: string | null;
    outcomes: BatchOutcome[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sending = mutation.isPending;
  const first = plan.entries[0];

  function handleClose() {
    setErrorMessage(null);
    setProgress({ done: 0, total: plan.entries.length });
    mutation.mutate(
      {
        entries: plan.entries,
        onProgress: (done, total) => setProgress({ done, total }),
      },
      {
        onSuccess: (outcome) => setResult(outcome),
        onError: (error) => {
          setProgress(null);
          setErrorMessage(error.message);
        },
      },
    );
  }

  function handleOpenChange(open: boolean) {
    if (open || sending) {
      return;
    }
    if (result) {
      onFinished();
      return;
    }
    onCancel();
  }

  const summary = result ? summarizeOutcomes(result.outcomes) : null;
  const problems = (result?.outcomes ?? []).filter(
    (outcome) => outcome.status !== 'sent' || outcome.moved === false,
  );

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Encerrar a vaga {job.title}</DialogTitle>
          <DialogDescription>
            Ao encerrar, a vaga deixa de aparecer para novos candidatos.
          </DialogDescription>
        </DialogHeader>

        {result && summary ? (
          <div className="space-y-4" aria-live="polite">
            <p className="text-sm font-medium">
              {result.closed
                ? `Vaga encerrada${
                    summary.sent + summary.emailFailed > 0
                      ? ` · ${plural(summary.sent + summary.emailFailed, 'retorno final registrado', 'retornos finais registrados')}`
                      : ''
                  }`
                : 'A vaga continua aberta'}
            </p>
            {result.message && (
              <p className="text-sm text-muted-foreground">{result.message}</p>
            )}
            {problems.length > 0 && (
              <ul className="space-y-1.5 text-sm">
                {problems.map((outcome) => (
                  <li
                    key={outcome.applicationId}
                    className="rounded-md border border-border px-3 py-2"
                  >
                    <span className="font-medium">{outcome.name}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      — {outcome.detail ?? 'Etapa não alterada.'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button className="w-full" onClick={onFinished}>
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <p className="text-sm">
                Esta vaga não tem candidatos aguardando retorno. Pode encerrar.
              </p>
            ) : (
              <>
                <p className="text-sm">
                  {plural(
                    pending.length,
                    'candidato ainda aguarda retorno',
                    'candidatos ainda aguardam retorno',
                  )}
                  . Antes de encerrar, cada um recebe uma resposta e vai para Rejeitado.
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {pending.slice(0, NAMES_SHOWN).map((candidate) => (
                    <li key={candidate.id}>
                      {candidate.name} · {candidate.stage}
                    </li>
                  ))}
                  {pending.length > NAMES_SHOWN && (
                    <li>e mais {pending.length - NAMES_SHOWN}</li>
                  )}
                </ul>
                {first && (
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Prévia do retorno final · Para {first.candidate.name}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{first.message}</p>
                  </div>
                )}
              </>
            )}

            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

            {sending && progress && progress.total > 0 && (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Enviando {progress.done} de {progress.total}...
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button disabled={sending} onClick={handleClose}>
                {sending
                  ? 'Encerrando...'
                  : pending.length === 0
                    ? 'Encerrar vaga'
                    : 'Enviar retorno final e encerrar'}
              </Button>
              {pending.length > 0 && (
                <Button variant="outline" disabled={sending} onClick={onOpenPipeline}>
                  Escolher outros motivos no Pipeline
                </Button>
              )}
              <Button variant="ghost" disabled={sending} onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
