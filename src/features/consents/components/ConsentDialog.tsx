import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PRIVACY_POLICY_BODY,
  PRIVACY_POLICY_TITLE,
  TCLE_BODY,
  TCLE_DRAFT_NOTICE,
  TCLE_TITLE,
  TERMS_BODY,
  TERMS_TITLE,
} from '../content';

interface ConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsentDialog({ open, onOpenChange }: ConsentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {TERMS_TITLE} · {PRIVACY_POLICY_TITLE} · {TCLE_TITLE}
          </DialogTitle>
          <DialogDescription className="text-destructive font-medium">
            {TCLE_DRAFT_NOTICE}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">{TERMS_TITLE}</h2>
            <p className="whitespace-pre-wrap">{TERMS_BODY}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">{PRIVACY_POLICY_TITLE}</h2>
            <p className="whitespace-pre-wrap">{PRIVACY_POLICY_BODY}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">{TCLE_TITLE}</h2>
            <p className="whitespace-pre-wrap">{TCLE_BODY}</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
