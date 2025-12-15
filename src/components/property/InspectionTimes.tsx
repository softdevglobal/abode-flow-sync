import { Calendar, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inspection } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InspectionTimesProps {
  inspections: Inspection[];
}

export function InspectionTimes({ inspections }: InspectionTimesProps) {
  if (inspections.length === 0) {
    return null;
  }

  const handleAddToCalendar = (inspection: Inspection) => {
    // Create calendar event URL (Google Calendar format)
    const startDate = format(inspection.date, "yyyyMMdd");
    const title = encodeURIComponent(`Property Inspection`);
    const details = encodeURIComponent(`Property inspection from ${inspection.startTime} to ${inspection.endTime}`);
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${startDate}&details=${details}`;
    
    window.open(googleCalendarUrl, '_blank');
    toast.success('Opening calendar...');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          Inspection Times
        </h2>
      </div>
      
      <div className="grid gap-3">
        {inspections.map((inspection) => (
          <div
            key={inspection.id}
            className="flex items-center justify-between bg-secondary/50 border border-border rounded-lg p-4 hover:bg-secondary/80 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Date Block */}
              <div className="bg-card rounded-lg p-3 text-center min-w-[60px] shadow-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {format(inspection.date, 'EEE')}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {format(inspection.date, 'd')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(inspection.date, 'MMM')}
                </p>
              </div>
              
              {/* Time & Type */}
              <div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {inspection.startTime} - {inspection.endTime}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={inspection.isPrivate ? 'outline' : 'success'} className="text-xs">
                    {inspection.isPrivate ? 'Private Inspection' : 'Open for Inspection'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Add to Calendar Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-accent hover:text-accent/80 hidden sm:flex"
              onClick={() => handleAddToCalendar(inspection)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add to calendar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
