import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppraisalForm, AppraisalFormData } from './AppraisalForm';

interface EditAppraisalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AppraisalFormData) => void;
  isSubmitting?: boolean;
  appraisal: AppraisalFormData | null;
}

export function EditAppraisalDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  appraisal,
}: EditAppraisalDialogProps) {
  if (!appraisal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Appraisal</DialogTitle>
          <DialogDescription>
            Update the property appraisal details.
          </DialogDescription>
        </DialogHeader>
        <AppraisalForm 
          onSubmit={onSubmit} 
          isSubmitting={isSubmitting}
          defaultValues={appraisal}
          submitLabel="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}
