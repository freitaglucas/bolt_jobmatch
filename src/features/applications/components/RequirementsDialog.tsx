import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { JobRequirementView } from '@/lib/types';
import type { RequirementAnswer } from '../apply';
import {
  buildRequirementAnswers,
  countAnswered,
  type RequirementPicks,
} from '../requirement-answers';

interface RequirementsDialogProps {
  jobTitle: string;
  requirements: JobRequirementView[];
  isSubmitting: boolean;
  onSubmit: (answers: RequirementAnswer[]) => void;
  onCancel: () => void;
}

// Perguntas sim/nao da vaga, respondidas ao clicar em Candidatar (N31).
export function RequirementsDialog({
  jobTitle,
  requirements,
  isSubmitting,
  onSubmit,
  onCancel,
}: RequirementsDialogProps) {
  const [picks, setPicks] = useState<RequirementPicks>({});
  const answers = buildRequirementAnswers(requirements, picks);
  const answered = countAnswered(requirements, picks);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Antes de enviar: requisitos da vaga</DialogTitle>
          <DialogDescription>
            Responda sim ou não para cada requisito de {jobTitle}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {requirements.map((requirement) => {
            const value = picks[requirement.id];
            return (
              <div key={requirement.id} className="rounded-xl border border-border p-3 space-y-2">
                <p className="text-sm font-medium">{requirement.question}</p>
                {requirement.detail && (
                  <p className="text-xs text-muted-foreground">{requirement.detail}</p>
                )}
                <div className="flex gap-2" role="group" aria-label={requirement.name}>
                  {([
                    { meets: true, label: 'Sim' },
                    { meets: false, label: 'Não' },
                  ] as const).map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={value === option.meets}
                      disabled={isSubmitting}
                      onClick={() =>
                        setPicks((previous) => ({ ...previous, [requirement.id]: option.meets }))
                      }
                      className={cn(
                        'h-11 min-w-20 px-4 rounded-lg border text-sm font-medium transition-all',
                        value === option.meets
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <p className="text-xs text-muted-foreground sm:mr-auto self-center">
            {answered} de {requirements.length} respondidos
          </p>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={answers === null || isSubmitting}
            onClick={() => {
              if (answers) {
                onSubmit(answers);
              }
            }}
            className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar candidatura'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
