import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Calendar, Clock, MapPin, Loader2, 
  LogIn, Home, CalendarCheck, ExternalLink, X
} from 'lucide-react';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { toast } from 'sonner';
interface InspectionBooking {
  id: string;
  inspection_id: string;
  customer_id: string;
  status: string;
  checked_in_at: string | null;
  created_at: string;
  inspection: {
    id: string;
    date_time: string;
    duration: number;
    status: string;
    property: {
      id: string;
      title: string;
      address: string;
      suburb: string;
      state: string;
      images: string[] | null;
    } | null;
  } | null;
}

export default function MyInspections() {
  const { user, loading: authLoading } = useAuth();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-inspection-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('inspection_bookings')
        .select(`
          id,
          inspection_id,
          customer_id,
          status,
          checked_in_at,
          created_at,
          inspection:inspections(
            id,
            date_time,
            duration,
            status,
            property:properties(
              id,
              title,
              address,
              suburb,
              state,
              images
            )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as InspectionBooking[];
    },
    enabled: !!user?.id,
  });

  const queryClient = useQueryClient();

  // Real-time subscription for inspection bookings
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('my-inspections-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspection_bookings',
          filter: `customer_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-inspection-bookings', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('inspection_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('customer_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-inspection-bookings'] });
      toast.success('RSVP cancelled');
    },
    onError: (error) => {
      console.error('Cancel RSVP error:', error);
      toast.error('Failed to cancel RSVP');
    },
  });

  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');
  const upcomingInspections = activeBookings.filter(
    (b) => b.inspection && isFuture(parseISO(b.inspection.date_time))
  );
  const pastInspections = activeBookings.filter(
    (b) => b.inspection && isPast(parseISO(b.inspection.date_time))
  );

  // Loading auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <BuyerLayout>
        <div className="container px-4 py-6 max-w-lg mx-auto">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <LogIn className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view your inspections</h2>
              <p className="text-muted-foreground mb-6">
                Track your RSVP'd property inspections and open homes.
              </p>
              <Button asChild size="lg">
                <Link to="/auth">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="container px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            My Inspections
          </h1>
          <p className="text-muted-foreground text-sm font-body">
            Your RSVP'd property inspections
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {upcomingInspections.length > 0 && (
              <section>
                <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  Upcoming ({upcomingInspections.length})
                </h2>
                <div className="space-y-3">
                  {upcomingInspections.map((booking) => (
                    <InspectionCard 
                      key={booking.id} 
                      booking={booking} 
                      onCancel={() => cancelMutation.mutate(booking.id)}
                      isCancelling={cancelMutation.isPending}
                    />
                  ))}
                </div>
              </section>
            )}

            {pastInspections.length > 0 && (
              <section>
                <h2 className="font-semibold text-lg mb-3 text-muted-foreground">
                  Past Inspections ({pastInspections.length})
                </h2>
                <div className="space-y-3">
                  {pastInspections.map((booking) => (
                    <InspectionCard key={booking.id} booking={booking} isPast />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}

function InspectionCard({ booking, isPast, onCancel, isCancelling }: { 
  booking: InspectionBooking; 
  isPast?: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
}) {
  const inspection = booking.inspection;
  const property = inspection?.property;

  if (!inspection) return null;

  const dateTime = parseISO(inspection.date_time);
  const endTime = new Date(dateTime.getTime() + inspection.duration * 60000);

  return (
    <Card className={isPast ? 'opacity-60' : ''}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Property Image */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted flex-shrink-0">
            {property?.images?.[0] ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Home className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm line-clamp-1">
                  {property?.title || 'Property'}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {property?.suburb}, {property?.state}
                </p>
              </div>
              {booking.checked_in_at ? (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Attended
                </Badge>
              ) : isPast ? (
                <Badge variant="secondary">Missed</Badge>
              ) : (
                <Badge variant="default" className="bg-primary/10 text-primary">
                  RSVP'd
                </Badge>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(dateTime, 'EEE, MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{format(dateTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
              </div>
            </div>

            {!isPast && property && (
              <div className="mt-3 flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                  <Link to={`/property/${property.id}`}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Property
                  </Link>
                </Button>
                {onCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isCancelling}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel RSVP
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel RSVP?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel your RSVP for this inspection? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep RSVP</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onCancel}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Cancel RSVP
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-display text-lg font-semibold mb-2">No inspections yet</h3>
      <p className="text-muted-foreground text-sm mb-4">
        RSVP to property inspections to see them here
      </p>
      <Button asChild variant="outline">
        <Link to="/browse">Browse Properties</Link>
      </Button>
    </div>
  );
}