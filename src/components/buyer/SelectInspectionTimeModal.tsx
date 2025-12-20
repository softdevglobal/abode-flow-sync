import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, Clock, CheckCircle, Loader2, MapPin, Home } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { InspectionInvitation, ProposedDate, useBuyerInvitations } from '@/hooks/useInspectionInvitations';

interface SelectInspectionTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: InspectionInvitation & { appraisal: any };
  customerId: string;
}

export function SelectInspectionTimeModal({
  open,
  onOpenChange,
  invitation,
  customerId,
}: SelectInspectionTimeModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { confirmInvitation, isConfirming } = useBuyerInvitations(customerId);

  const proposedDates = invitation.proposed_dates as ProposedDate[];

  const handleSelectSlot = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }

    try {
      await confirmInvitation({
        invitationId: invitation.id,
        selectedDate,
        selectedTime,
        buyerMessage: message || undefined,
      });

      toast.success('Inspection time confirmed! The agent has been notified.');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to confirm time');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Select Inspection Time
          </DialogTitle>
          <DialogDescription>
            Choose a time that works for you to inspect the property.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Property Info */}
            {invitation.appraisal && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {invitation.appraisal.images?.[0] ? (
                    <img
                      src={invitation.appraisal.images[0]}
                      alt={invitation.appraisal.address}
                      className="w-20 h-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-20 h-16 rounded-md bg-muted flex items-center justify-center">
                      <Home className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{invitation.appraisal.address}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {invitation.appraisal.suburb}, {invitation.appraisal.state} {invitation.appraisal.postcode}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Agent Message */}
            {invitation.agent_message && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Message from agent:</p>
                <p className="text-foreground italic">"{invitation.agent_message}"</p>
              </div>
            )}

            {/* Available Times */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Available Times</Label>
              
              {proposedDates.map((dateSlot) => {
                const date = parseISO(dateSlot.date);
                
                return (
                  <div key={dateSlot.date} className="border border-border/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      <span className="font-medium">
                        {format(date, 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dateSlot.times.map((time) => {
                        const isSelected = selectedDate === dateSlot.date && selectedTime === time;
                        
                        return (
                          <Badge
                            key={`${dateSlot.date}-${time}`}
                            variant={isSelected ? 'default' : 'outline'}
                            className={cn(
                              'cursor-pointer transition-all py-2 px-3',
                              isSelected
                                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                : 'hover:bg-primary/10 hover:border-primary'
                            )}
                            onClick={() => handleSelectSlot(dateSlot.date, time)}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {time}
                            {isSelected && <CheckCircle className="w-3 h-3 ml-1" />}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Summary */}
            {selectedDate && selectedTime && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Selected: {format(parseISO(selectedDate), 'EEEE, MMMM d')} at {selectedTime}
                  </span>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="buyer-message">Message to Agent (Optional)</Label>
              <Textarea
                id="buyer-message"
                placeholder="Looking forward to the inspection..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isConfirming || !selectedDate || !selectedTime}
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Time
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
