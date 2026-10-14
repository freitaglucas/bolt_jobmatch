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
  checkEligibility,
  defaultDueDate,
  dueDateBounds,
  pickPreview,
  summarizeOutcomes,
  validateComposerTexts,
  validateDueDate,
  type BatchFeedbackType,
  type BatchOutcome,
} from '../batch-feedback';
import { useGiveBatchFeedback } from '../batch-feedback.hooks';
import { useMatchInsights } from '../match-insights.hooks';
import {
  REASON_CODES,
  REASON_HINTS,
  REASON_LABELS,
  allGroupsConfirmed,
  groupByReason,
  resolveReasons,
  type MatchInsights,
  type ReasonCode,
} from '../rejection-reasons';

interface BatchFeedbackDialogProps {
  candidates: PipelineCandidate[];
  onClose: () => void;
  // Chamado ao fechar depois de um envio (limpa a selecao na tela).
  onDone: () => void;
}

const PREVIEW_COUNT = 3;
const NO_INSIGHTS: Record<string, MatchInsights> = {};
const NO_OVERRIDES: Record<string, ReasonCode> = {};

const TYPE_OPTIONS: {
  value: BatchFeedbackType;
  label: string;
  hint: string;
}[] = [
  {
    value: 'update',
    label: 'Atualização',
    hint: 'Segue no processo, com nova data de retorno',
  },
  {
    value: 'reject',
    label: 'Não avançou',
    hint: 'Com o motivo de cada candidato. Vai para Rejeitado',
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
  // Nao avancou: motivos escolhidos a mao, grupos confirmados e pontos fortes.
  const [overrides, setOverrides] = useState<Record<string, ReasonCode>>(NO_OVERRIDES);
  const [confirmed, setConfirmed] = useState<ReadonlySet<ReasonCode>>(new Set());
  const [includeStrengths, setIncludeStrengths] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [outcomes, setOutcomes] = useState<BatchOutcome[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mutation = useGiveBatchFeedback();

  const rejecting = type === 'reject';
  const insightsQuery = useMatchInsights(
    candidates.map((candidate) => candidate.id),
    rejecting,
  );
  const insights = insightsQuery.data ?? NO_INSIGHTS;

  const bounds = dueDateBounds(now);
  const dateError = type === 'update' ? validateDueDate(dueDate, now) : null;
  const textError = validateComposerTexts(opening, closing);

  // Quem pode receber "nao avancou" e o motivo de cada um (sugerido ou escolhido).
  const rejectPool = useMemo(
    () =>
      rejecting
        ? candidates.filter(
            (candidate) => checkEligibility(candidate, 'reject', { dueDate, now }) === null,
          )
        : [],
    [rejecting, candidates, dueDate, now],
  );
  const reasons = useMemo(
    () => resolveReasons(rejectPool, insights, overrides),
    [rejectPool, insights, overrides],
  );
  const groups = useMemo(() => groupByReason(rejectPool, reasons), [rejectPool, reasons]);

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
            rejection: rejecting ? { reasons, insights, includeStrengths } : undefined,
          }),
    [
      type,
      candidates,
      opening,
      closing,
      dueDate,
      dateError,
      rejecting,
      reasons,
      insights,
      includeStrengths,
    ],
  );

  const sending = mutation.isPending;
  const rejectionReady =
    !rejecting || (insightsQuery.isSuccess && allGroupsConfirmed(groups, confirmed));
  const canSend =
    !sending && !dateError && !textError && plan.entries.length > 0 && rejectionReady;
  const preview = pickPreview(plan.entries, PREVIEW_COUNT);

  function changeReason(candidateId: string, reason: ReasonCode) {
    setOverrides((current) => ({ ...current, [candidateId]: reason }));
    // O grupo que recebeu mais um candidato precisa ser confirmado de novo.
    setConfirmed((current) => {
      const next = new Set(current);
      next.delete(reason);
      return next;
    });
  }

  function toggleConfirmed(reason: ReasonCode) {
    setConfirmed((current) => {
      const next = new Set(current);
      if (next.has(reason)) {
        next.delete(reason);
      } else {
        next.add(reason);
      }
      return next;
    });
  }

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
                      disabled={sending}
                      aria-pressed={selected}
                      onClick={() => setType(option.value)}
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

            {type === 'update' && (
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
            )}

            {type === 'advance' && (
              <p className="text-sm text-muted-foreground">
                Os candidatos vão para a próxima etapa e o prazo de retorno recomeça
                (5 dias). A aprovação final continua individual.
              </p>
            )}

            {rejecting && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Os candidatos vão para Rejeitado. O motivo é sugerido pelo que cada um
                  informou no perfil: confirme cada grupo antes de enviar. Não há texto
                  livre de motivo no lote.
                </p>

                {insightsQuery.isLoading && (
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    Analisando os perfis...
                  </p>
                )}
                {insightsQuery.isError && (
                  <p className="text-sm text-destructive">
                    Não foi possível ler os perfis para sugerir os motivos. Feche e tente
                    de novo.
                  </p>
                )}

                {insightsQuery.isSuccess &&
                  groups.map((group) => (
                    <div
                      key={group.reason}
                      className="rounded-lg border border-border p-3 space-y-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {REASON_LABELS[group.reason]} ·{' '}
                          {plural(group.candidates.length, 'candidato', 'candidatos')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {REASON_HINTS[group.reason]}
                        </p>
                      </div>
                      <ul className="space-y-1">
                        {group.candidates.map((candidate) => (
                          <li
                            key={candidate.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="truncate">{candidate.name}</span>
                            <select
                              aria-label={`Motivo para ${candidate.name}`}
                              value={group.reason}
                              disabled={sending}
                              onChange={(event) =>
                                changeReason(candidate.id, event.target.value as ReasonCode)
                              }
                              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                            >
                              {REASON_CODES.map((code) => (
                                <option key={code} value={code}>
                                  {REASON_LABELS[code]}
                                </option>
                              ))}
                            </select>
                          </li>
                        ))}
                      </ul>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={confirmed.has(group.reason)}
                          disabled={sending}
                          onChange={() => toggleConfirmed(group.reason)}
                        />
                        Confirmo este motivo para{' '}
                        {plural(group.candidates.length, 'candidato', 'candidatos')}
                      </label>
                    </div>
                  ))}

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={includeStrengths}
                    disabled={sending}
                    onChange={(event) => setIncludeStrengths(event.target.checked)}
                  />
                  Incluir pontos fortes do candidato na mensagem
                </label>
              </div>
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
                      {entry.reasonCode && ` · ${REASON_LABELS[entry.reasonCode]}`}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{entry.message}</p>
                  </div>
                ))}
              </div>
            )}

            {rejecting && insightsQuery.isSuccess && !rejectionReady && (
              <p className="text-xs text-muted-foreground">
                Confirme todos os grupos de motivo para liberar o envio.
              </p>
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
