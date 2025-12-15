import { Calendar, Clock, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inspection } from '@/types';
import { format, addMinutes, parse } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface InspectionTimesProps {
  inspections: Inspection[];
}

interface BookingStatus {
  [inspectionId: string]: 'none' | 'booked' | 'loading';
}

export function InspectionTimes({ inspections }: InspectionTimesProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>({});

  // Check existing bookings for this user
  useEffect(() => {
    if (!user || inspections.length === 0) return;

    const checkExistingBookings = async () => {
      const inspectionIds = inspections.map(i => i.id);
      const { data: bookings } = await supabase
        .from('inspection_bookings')
        .select('inspection_id')
        .eq('customer_id', user.id)
        .in('inspection_id', inspectionIds)
        .neq('status', 'cancelled');

      if (bookings) {
        setBookingStatus(prev => {
          const statusMap: BookingStatus = { ...prev };
          inspectionIds.forEach(id => {
            // Only update if not currently loading (preserve loading state)
            if (prev[id] !== 'loading') {
              statusMap[id] = bookings.some(b => b.inspection_id === id) ? 'booked' : 'none';
            }
          });
          return statusMap;
        });
      }
    };

    checkExistingBookings();
  }, [user, inspections]);

  if (inspections.length === 0) {
    return null;
  }

  const handleRSVP = async (inspection: Inspection) => {
    if (!user) {
      // Store redirect and go to auth
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      navigate('/auth');
      return;
    }

    setBookingStatus(prev => ({ ...prev, [inspection.id]: 'loading' }));

    try {
      // Create booking in database
      const { error } = await supabase
        .from('inspection_bookings')
        .insert({
          inspection_id: inspection.id,
          customer_id: user.id,
          status: 'confirmed'
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('You have already RSVP\'d for this inspection');
          setBookingStatus(prev => ({ ...prev, [inspection.id]: 'booked' }));
          return;
        }
        throw error;
      }

      setBookingStatus(prev => ({ ...prev, [inspection.id]: 'booked' }));
      
      // Add to calendar
      addToCalendar(inspection);
      
      toast.success('RSVP confirmed! Event added to your calendar.');
    } catch (error) {
      console.error('RSVP error:', error);
      toast.error('Failed to RSVP. Please try again.');
      setBookingStatus(prev => ({ ...prev, [inspection.id]: 'none' }));
    }
  };

  const addToCalendar = (inspection: Inspection) => {
    // Parse start and end times properly
    const startDateTime = new Date(inspection.date);
    const [startHour, startMin] = inspection.startTime.split(':').map(Number);
    startDateTime.setHours(startHour, startMin, 0, 0);

    const endDateTime = new Date(inspection.date);
    const [endHour, endMin] = inspection.endTime.split(':').map(Number);
    endDateTime.setHours(endHour, endMin, 0, 0);

    // Format for Google Calendar (YYYYMMDDTHHmmss)
    const formatDateTime = (date: Date) => {
      return format(date, "yyyyMMdd'T'HHmmss");
    };

    const title = encodeURIComponent('Property Inspection');
    const details = encodeURIComponent(
      `Property inspection scheduled from ${inspection.startTime} to ${inspection.endTime}.\n\nYou have confirmed your attendance.`
    );

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDateTime(startDateTime)}/${formatDateTime(endDateTime)}&details=${details}`;

    window.open(googleCalendarUrl, '_blank');
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
        {inspections.map((inspection) => {
          const status = bookingStatus[inspection.id] || 'none';
          const isBooked = status === 'booked';
          const isLoading = status === 'loading';

          return (
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
                    {isBooked && (
                      <Badge variant="default" className="text-xs bg-accent">
                        <Check className="w-3 h-3 mr-1" />
                        RSVP'd
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* RSVP / Add to Calendar Button */}
              <Button
                variant={isBooked ? 'outline' : 'default'}
                size="sm"
                className="hidden sm:flex"
                onClick={() => isBooked ? addToCalendar(inspection) : handleRSVP(inspection)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    RSVP'ing...
                  </>
                ) : isBooked ? (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Calendar
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-1" />
                    RSVP & Add to Calendar
                  </>
                )}
              </Button>

              {/* Mobile button */}
              <Button
                variant={isBooked ? 'outline' : 'default'}
                size="icon"
                className="sm:hidden"
                onClick={() => isBooked ? addToCalendar(inspection) : handleRSVP(inspection)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isBooked ? (
                  <Plus className="w-4 h-4" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
