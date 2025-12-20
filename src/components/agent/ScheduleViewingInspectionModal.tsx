import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Home, User, Loader2 } from 'lucide-react';

interface ViewingRequest {
  id: string;
  property_id: string;
  customer_id: string;
  property: {
    title: string;
    address: string;
    suburb: string;
  };
  customer: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

interface ScheduleViewingInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewingRequest: ViewingRequest;
}

export function ScheduleViewingInspectionModal({
  open,
  onOpenChange,
  viewingRequest,
}: ScheduleViewingInspectionModalProps) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');

  const createInspectionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate) throw new Error('Please select a date');
      
      // Create the inspection
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .insert({
          property_id: viewingRequest.property_id,
          date_time: dateTime.toISOString(),
          duration,
          notes: notes || null,
          status: 'scheduled',
          max_attendees: 1, // Private viewing
        })
        .select()
        .single();

      if (inspectionError) throw inspectionError;

      // Create a booking for the customer
      const { error: bookingError } = await supabase
        .from('inspection_bookings')
        .insert({
          inspection_id: inspection.id,
          customer_id: viewingRequest.customer_id,
          status: 'confirmed',
        });

      if (bookingError) throw bookingError;

      // Update viewing request status to confirmed
      const { error: updateError } = await supabase
        .from('viewing_requests')
        .update({ status: 'confirmed' })
        .eq('id', viewingRequest.id);

      if (updateError) throw updateError;

      // Create a notification for the customer
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: viewingRequest.customer_id,
          type: 'inspection_reminder',
          title: 'Viewing Scheduled',
          message: `Your viewing for ${viewingRequest.property.title} has been scheduled for ${format(dateTime, 'MMMM d, yyyy')} at ${selectedTime}`,
          data: {
            inspection_id: inspection.id,
            property_id: viewingRequest.property_id,
          },
        });

      if (notifError) console.error('Failed to create notification:', notifError);

      return inspection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viewing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['agent-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['diary-inspections'] });
      toast.success('Inspection scheduled and customer notified');
      onOpenChange(false);
      // Reset form
      setSelectedDate(new Date());
      setSelectedTime('10:00');
      setDuration(30);
      setNotes('');
    },
    onError: (error) => {
      console.error('Error scheduling inspection:', error);
      toast.error('Failed to schedule inspection');
    },
  });

  const customerName = viewingRequest.customer.first_name
    ? `${viewingRequest.customer.first_name} ${viewingRequest.customer.last_name || ''}`.trim()
    : viewingRequest.customer.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Schedule Private Viewing</DialogTitle>
          <DialogDescription>
            Schedule a private viewing for this customer's request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Property Info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{viewingRequest.property.title}</p>
                <p className="text-sm text-muted-foreground">
                  {viewingRequest.property.address}, {viewingRequest.property.suburb}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">{customerName}</p>
                <p className="text-sm text-muted-foreground">{viewingRequest.customer.email}</p>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Select Date
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-lg border border-border/50"
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time
              </Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                min={15}
                max={120}
                step={15}
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this viewing..."
              className="bg-background border-border resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createInspectionMutation.mutate()}
              disabled={!selectedDate || createInspectionMutation.isPending}
              className="gap-2"
            >
              {createInspectionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4" />
                  Schedule Viewing
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
