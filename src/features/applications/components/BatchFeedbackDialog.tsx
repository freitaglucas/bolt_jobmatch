import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import type { PipelineCandidate } from '../../../lib/types';
import { cn } from '../../../lib/utils';
import {
  BATCH_TEXT_MAX_LENGTH,
  DEFAULT_CLOSING,
  DEFAULT_OPENING,
  buildBatchPlan,
  defaultDueDate,
  dueDateBounds,
  summarizeOutcomes,
  validateComposerTexts,
  validateDueDate,
  type BatchFeedbackType,
  type BatchOutcome,
} from '../batch-feedback';
import { useGiveBatchFeedback } from '../batch-feedback.hooks';

interface BatchFeedbackDialogProps {
  candidates: PipelineCandidate[];
  onClose: () => void;
  // Chamado ao fechar depois de um envio (limpa a selecao na tela).
  onDone: () => void;
}

const PREVIEW_COUNT = 3;

const TYPE_OPTIONS: {
  value: BatchFeedbackType | 'reject';
  label: string;
  hint: string;
  disabled?: boolean;
}[] = [
  {
    value: 'update',
    label: 'Atualização',
    hint: 'Segue no processo, com nova data de retorno',
  },
  {
    value: 'reject',
    label: 'Não avançou',
    hint: 'Com motivo por candidato. Chega no próximo passo',
    disabled: true,
  },
  {
    value: 'advance',
    label: 'Avançou',
    hint: 'Vai para a próxima etapa e recebe o aviso',
  },
];

function plural(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

export function BatchFeedbackDialog({
  candidates,
  onClose,
  onDone,
}: BatchFeedbackDialogProps) {
  const [now] = useState(() => new Date());
  const [type, setType] = useState<BatchFeedbackType>('update');
  const [dueDate, setDueDate] = useState(() => defaultDueDate(now));
  const [opening, setOpening] = useState(DEFAULT_OPENING);
  const [closing, setClosing] = useState(DEFAULT_CLOSING);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [outcomes, setOutcomes] = useState<BatchOutcome[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mutation = useGiveBatchFeedback();

  const bounds = dueDateBounds(now);
  const dateError = type === 'update' ? validateDueDate(dueDate, now) : null;
  const textError = validateComposerTexts(opening, closing);

  // A mensagem e remontada a cada mudanca: previa e envio usam o mesmo texto.
  const plan = useMemo(
    () =>
      dateError
        ? { entries: [], excluded: [] }
        : buildBatchPlan({
            type,
            candidates,
            opening,
            closing,
            dueDate,
            now: new Date(),
          }),
    [type, candidates, opening, closing, dueDate, dateError],
  );

  const sending = mutation.isPending;
  const canSend = !sending && !dateError && !textError && plan.entries.length > 0;
  const preview = plan.entries.slice(0, PREVIEW_COUNT);

  function handleSend() {
    setErrorMessage(null);
    setProgress({ done: 0, total: plan.entries.length });
    mutation.mutate(
      {
        entries: plan.entries,
        onProgress: (done, total) => setProgress({ done, total }),
      },
      {
        onSuccess: (result) => setOutcomes(result),
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
    if (outcomes) {
      onDone();
      return;
    }
    onClose();
  }

  const summary = outcomes ? summarizeOutcomes(outcomes) : null;
  const problems = (outcomes ?? []).filter((outcome) => outcome.status !== 'sent');

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Dar retorno a {plural(candidates.length, 'candidato', 'candidatos')}
          </DialogTitle>
          <DialogDescription>
            Cada candidato recebe a própria mensagem, no app e por e-mail. É grátis e
            nunca trava.
          </DialogDescription>
        </DialogHeader>

        {outcomes && summary ? (
          <div className="space-y-4" aria-live="polite">
            <p className="text-sm font-medium">
              {plural(summary.sent, 'retorno enviado', 'retornos enviados')}
              {summary.moved > 0 &&
                ` · ${plural(summary.moved, 'candidato movido', 'candidatos movidos')} de etapa`}
            </p>
            {problems.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {plural(problems.length, 'candidato precisa', 'candidatos precisam')} de
                  atenção:
                </p>
                <ul className="space-y-1.5 text-sm">
                  {problems.map((outcome) => (
                    <li
                      key={outcome.applicationId}
                      className="rounded-md border border-border px-3 py-2"
                    >
                      <span className="font-medium">{outcome.name}</span>
                      <span className="text-muted-foreground"> — {outcome.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button className="w-full" onClick={onDone}>
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium mb-2">Tipo de retorno</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {TYPE_OPTIONS.map((option) => {
                  const selected = option.value === type;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled || sending}
                      aria-pressed={selected}
                      onClick={() => {
                        if (option.value !== 'reject') {
                          setType(option.value);
                        }
                      }}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/40',
                      )}
                    >
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {type === 'update' ? (
              <div className="space-y-1.5">
                <label htmlFor="batch-due-date" className="text-sm font-medium">
                  Novo prazo de retorno
                </label>
                <Input
                  id="batch-due-date"
                  type="date"
                  value={dueDate}
                  min={bounds.min}
                  max={bounds.max}
                  disabled={sending}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-48"
                />
                {dateError ? (
                  <p className="text-xs text-destructive">{dateError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Até 13 dias a partir de hoje. Cada candidato pode ter 2 adiamentos
                    por etapa.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Os candidatos vão para a próxima etapa e o prazo de retorno recomeça
                (5 dias). A aprovação final continua individual.
              </p>
            )}

            <div className="space-y-1.5">
              <label htmlFor="batch-opening" className="text-sm font-medium">
                Abertura
              </label>
              <Input
                id="batch-opening"
                value={opening}
                maxLength={BATCH_TEXT_MAX_LENGTH}
                disabled={sending}
                onChange={(event) => setOpening(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {'{nome}'} vira o primeiro nome de cada candidato.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="batch-closing" className="text-sm font-medium">
                Fechamento
              </label>
              <Textarea
                id="batch-closing"
                value={closing}
                maxLength={BATCH_TEXT_MAX_LENGTH}
                disabled={sending}
                onChange={(event) => setClosing(event.target.value)}
              />
            </div>

            {textError && <p className="text-xs text-destructive">{textError}</p>}

            {plan.excluded.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                <p className="font-medium">
                  {plural(plan.excluded.length, 'candidato fica', 'candidatos ficam')} de
                  fora
                </p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                  {plan.excluded.map(({ candidate, reason }) => (
                    <li key={candidate.id}>
                      {candidate.name}: {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Prévia ({preview.length} de {plan.entries.length})
                </p>
                {preview.map((entry) => (
                  <div
                    key={entry.candidate.id}
                    className="rounded-md border border-border p-3"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Para {entry.candidate.name}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{entry.message}</p>
                  </div>
                ))}
              </div>
            )}

            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

            {sending && progress && (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Enviando {progress.done} de {progress.total}...
              </p>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" disabled={!canSend} onClick={handleSend}>
                {sending
                  ? 'Enviando...'
                  : `Enviar ${plural(plan.entries.length, 'retorno', 'retornos')}`}
              </Button>
              <Button variant="ghost" disabled={sending} onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
