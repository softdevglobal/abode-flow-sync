import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppraisalForm, AppraisalFormData } from './AppraisalForm';

interface CreateAppraisalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AppraisalFormData) => void;
  isSubmitting?: boolean;
}

export function CreateAppraisalDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateAppraisalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">New Appraisal</DialogTitle>
          <DialogDescription>
            Create a property appraisal with an estimated price range.
          </DialogDescription>
        </DialogHeader>
        <AppraisalForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}
