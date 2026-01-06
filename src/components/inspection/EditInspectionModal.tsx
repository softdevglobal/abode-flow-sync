import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { InspectionWithProperty } from '@/hooks/useAgentInspections';

const editInspectionSchema = z.object({
  date: z.date({ required_error: 'Please select a date' }),
  time: z.string().min(1, 'Please select a time'),
  duration: z.coerce.number().min(15).max(180),
  max_attendees: z.coerce.number().min(1).max(100),
  notes: z.string().optional(),
});

type EditInspectionFormData = z.infer<typeof editInspectionSchema>;

interface EditInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection: InspectionWithProperty | null;
  onSubmit: (id: string, data: { date_time: string; duration: number; max_attendees: number; notes?: string }) => Promise<void>;
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00',
];

const durationOptions = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
];

export function EditInspectionModal({
  open,
  onOpenChange,
  inspection,
  onSubmit,
}: EditInspectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditInspectionFormData>({
    resolver: zodResolver(editInspectionSchema),
    defaultValues: {
      duration: 30,
      max_attendees: 20,
      notes: '',
    },
  });

  // Reset form when inspection changes
  useEffect(() => {
    if (inspection && open) {
      const dateTime = new Date(inspection.date_time);
      const hours = dateTime.getHours().toString().padStart(2, '0');
      const minutes = dateTime.getMinutes().toString().padStart(2, '0');
      
      form.reset({
        date: dateTime,
        time: `${hours}:${minutes}`,
        duration: inspection.duration,
        max_attendees: inspection.max_attendees || 20,
        notes: inspection.notes || '',
      });
    }
  }, [inspection, open, form]);

  const handleSubmit = async (data: EditInspectionFormData) => {
    if (!inspection) return;
    
    setIsSubmitting(true);
    try {
      const dateTime = new Date(data.date);
      const [hours, minutes] = data.time.split(':').map(Number);
      dateTime.setHours(hours, minutes, 0, 0);

      await onSubmit(inspection.id, {
        date_time: dateTime.toISOString(),
        duration: data.duration,
        max_attendees: data.max_attendees,
        notes: data.notes || undefined,
      });
      
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!inspection) return null;

  const property = inspection.property;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Inspection</DialogTitle>
        </DialogHeader>

        {/* Property Info */}
        <div className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 mb-4">
          {property?.images?.[0] ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-lg" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate font-body">{property?.title || 'Property'}</p>
            <p className="text-xs text-muted-foreground font-body">
              {property?.address}, {property?.suburb}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-body">Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-body hover:border-primary/50",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background/95 backdrop-blur-sm border-border/50" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="font-body" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body">Time *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time} className="font-body">
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="font-body" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body">Duration *</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={String(option.value)} className="font-body">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="font-body" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_attendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body">Max Attendees</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} className="font-body" />
                    </FormControl>
                    <FormMessage className="font-body" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-body">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions or notes..."
                      className="resize-none font-body"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="font-body" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-body hover:border-primary/50">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-body shadow-glow-sm">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
