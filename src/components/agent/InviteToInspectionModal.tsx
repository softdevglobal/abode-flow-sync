import { useState } from 'react';
import { format, addDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, Clock, Send, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useInspectionInvitations, ProposedDate } from '@/hooks/useInspectionInvitations';

interface InviteToInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interest: {
    id: string;
    appraisal_id: string;
    customer_id: string;
    customer: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
    appraisal: {
      address: string;
      suburb: string;
    };
  };
  agentId: string;
}

const TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
];

export function InviteToInspectionModal({
  open,
  onOpenChange,
  interest,
  agentId,
}: InviteToInspectionModalProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timesByDate, setTimesByDate] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const { createInvitation, isCreating } = useInspectionInvitations(agentId);

  const customerName = interest.customer.first_name
    ? `${interest.customer.first_name} ${interest.customer.last_name || ''}`.trim()
    : interest.customer.email;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    if (selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateStr)) {
      // Remove date
      setSelectedDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
      setTimesByDate(prev => {
        const newTimes = { ...prev };
        delete newTimes[dateStr];
        return newTimes;
      });
    } else {
      // Add date with default times
      setSelectedDates(prev => [...prev, date]);
      setTimesByDate(prev => ({
        ...prev,
        [dateStr]: ['10:00 AM', '02:00 PM'],
      }));
    }
  };

  const toggleTime = (dateStr: string, time: string) => {
    setTimesByDate(prev => {
      const currentTimes = prev[dateStr] || [];
      if (currentTimes.includes(time)) {
        return {
          ...prev,
          [dateStr]: currentTimes.filter(t => t !== time),
        };
      } else {
        return {
          ...prev,
          [dateStr]: [...currentTimes, time].sort((a, b) => {
            const toMinutes = (t: string) => {
              const [time, period] = t.split(' ');
              const [hours, mins] = time.split(':').map(Number);
              return (hours % 12 + (period === 'PM' ? 12 : 0)) * 60 + mins;
            };
            return toMinutes(a) - toMinutes(b);
          }),
        };
      }
    });
  };

  const removeDate = (dateStr: string) => {
    setSelectedDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
    setTimesByDate(prev => {
      const newTimes = { ...prev };
      delete newTimes[dateStr];
      return newTimes;
    });
  };

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    const proposedDates: ProposedDate[] = selectedDates
      .map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
          date: dateStr,
          times: timesByDate[dateStr] || [],
        };
      })
      .filter(d => d.times.length > 0);

    if (proposedDates.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }

    try {
      await createInvitation({
        appraisalInterestId: interest.id,
        appraisalId: interest.appraisal_id,
        agentId,
        customerId: interest.customer_id,
        proposedDates,
        agentMessage: message || undefined,
      });

      toast.success('Inspection invitation sent!');
      onOpenChange(false);
      setSelectedDates([]);
      setTimesByDate({});
      setMessage('');
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Invite to Inspection
          </DialogTitle>
          <DialogDescription>
            Select available dates and times for {customerName} to inspect{' '}
            <span className="font-medium text-foreground">{interest.appraisal.address}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Calendar */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Label className="text-sm font-medium mb-2 block">Select Dates</Label>
                <Calendar
                  mode="single"
                  selected={undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  modifiers={{
                    selected: selectedDates,
                  }}
                  modifiersClassNames={{
                    selected: 'bg-primary text-primary-foreground',
                  }}
                  className="rounded-md border pointer-events-auto"
                />
              </div>

              {/* Selected Dates & Times */}
              <div className="flex-1 space-y-4">
                <Label className="text-sm font-medium">Selected Dates & Times</Label>
                
                {selectedDates.length === 0 ? (
                  <div className="bg-muted/50 rounded-lg p-4 text-center text-muted-foreground">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click on dates in the calendar to add inspection times</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map(date => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const selectedTimes = timesByDate[dateStr] || [];
                        
                        return (
                          <div key={dateStr} className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {format(date, 'EEEE, MMMM d')}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => removeDate(dateStr)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {TIME_SLOTS.map(time => (
                                <Badge
                                  key={time}
                                  variant={selectedTimes.includes(time) ? 'default' : 'outline'}
                                  className={cn(
                                    'cursor-pointer transition-all',
                                    selectedTimes.includes(time)
                                      ? 'bg-primary text-primary-foreground'
                                      : 'hover:bg-primary/10'
                                  )}
                                  onClick={() => toggleTime(dateStr, time)}
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  {time}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message to Buyer (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message..."
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
          <Button onClick={handleSubmit} disabled={isCreating || selectedDates.length === 0}>
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
