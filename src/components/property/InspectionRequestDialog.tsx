import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays } from 'date-fns';
import { z } from 'zod';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Clock, Loader2, LogIn } from 'lucide-react';

// Validation schema
const requestSchema = z.object({
  date: z.date({ required_error: 'Please select a date' }),
  time: z.string().min(1, 'Please select a time'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

interface InspectionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  agentId: string;
}

// Generate time slots
const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
];

export function InspectionRequestDialog({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  agentId,
}: InspectionRequestDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ date?: string; time?: string; message?: string }>({});

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // Validate
      const result = requestSchema.safeParse({ date, time, message });
      if (!result.success) {
        const fieldErrors: { date?: string; time?: string; message?: string } = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
        throw new Error('Validation failed');
      }

      setErrors({});

      const { error } = await supabase.from('viewing_requests').insert({
        property_id: propertyId,
        customer_id: user.id,
        agent_id: agentId,
        requested_date: format(date!, 'yyyy-MM-dd'),
        requested_time: time,
        message: message.trim() || null,
        status: 'pending',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request sent to agent!', {
        description: 'You will be notified when the agent responds.',
      });
      queryClient.invalidateQueries({ queryKey: ['viewing-requests'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.message !== 'Validation failed') {
        console.error('Failed to create viewing request:', error);
        toast.error('Failed to send request', {
          description: 'Please try again later.',
        });
      }
    },
  });

  const resetForm = () => {
    setDate(undefined);
    setTime('');
    setMessage('');
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRequestMutation.mutate();
  };

  const handleSignIn = () => {
    sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
    navigate('/auth');
  };

  // Not logged in state
  if (!authLoading && !user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              You need to sign in to request an inspection.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <LogIn className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Create an account or sign in to request private viewings and track your requests.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignIn}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Inspection</DialogTitle>
          <DialogDescription>
            Request a private viewing for <span className="font-medium">{propertyTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date">Preferred Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                    errors.date && 'border-destructive'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          {/* Time Select */}
          <div className="space-y-2">
            <Label htmlFor="time">Preferred Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger
                id="time"
                className={cn(errors.time && 'border-destructive')}
              >
                <SelectValue placeholder="Select a time">
                  {time ? (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {time}
                    </span>
                  ) : (
                    'Select a time'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time && <p className="text-xs text-destructive">{errors.time}</p>}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Any specific questions or requirements..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              className={cn(errors.message && 'border-destructive')}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.message || ''}</span>
              <span>{message.length}/500</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRequestMutation.isPending}>
              {createRequestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
