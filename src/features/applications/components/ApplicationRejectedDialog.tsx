import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RejectionNotice } from '../requirement-answers';

interface ApplicationRejectedDialogProps {
  notice: RejectionNotice;
  onClose: () => void;
  onSeeApplications: () => void;
}

// Aviso na hora da recusa por requisito excludente (N31).
export function ApplicationRejectedDialog({
  notice,
  onClose,
  onSeeApplications,
}: ApplicationRejectedDialogProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{notice.title}</DialogTitle>
          <DialogDescription>{notice.body}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            type="button"
            onClick={onSeeApplications}
            className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
          >
            Ver minhas candidaturas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
