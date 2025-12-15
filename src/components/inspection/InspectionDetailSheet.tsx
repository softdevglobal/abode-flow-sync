import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, Bell, X, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInspectionBookings, type InspectionWithProperty } from '@/hooks/useAgentInspections';
import { toast } from 'sonner';

interface InspectionDetailSheetProps {
  inspection: InspectionWithProperty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (id: string) => void;
}

export function InspectionDetailSheet({
  inspection,
  open,
  onOpenChange,
  onCancel,
}: InspectionDetailSheetProps) {
  const { data: bookings, isLoading: bookingsLoading } = useInspectionBookings(inspection?.id || '');

  if (!inspection) return null;

  const property = inspection.property;
  const dateTime = new Date(inspection.date_time);
  const endTime = new Date(dateTime.getTime() + inspection.duration * 60000);
  const isCancelled = inspection.status === 'cancelled';

  const handleSendReminder = () => {
    toast.success('Reminder notifications sent to all registered attendees');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Inspection Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Property Info */}
          <div className="flex gap-4">
            {property?.images?.[0] ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-foreground line-clamp-2">
                {property?.title || 'Unknown Property'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {property?.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {property?.suburb}, {property?.state} {property?.postcode}
              </p>
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{format(dateTime, 'EEEE, MMMM d, yyyy')}</p>
                <p className="text-sm text-muted-foreground">
                  {format(dateTime, 'h:mm a')} - {format(endTime, 'h:mm a')} ({inspection.duration} min)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {inspection.current_attendees || 0} of {inspection.max_attendees} attendees
                </p>
                <p className="text-sm text-muted-foreground">
                  {(inspection.max_attendees || 20) - (inspection.current_attendees || 0)} spots remaining
                </p>
              </div>
            </div>
          </div>

          {inspection.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Notes</p>
                <p className="text-sm text-muted-foreground">{inspection.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Registered Attendees */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registered Attendees</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !bookings || bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No registered attendees yet</p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {booking.profiles?.first_name} {booking.profiles?.last_name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {booking.profiles?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {booking.profiles.email}
                            </span>
                          )}
                          {booking.profiles?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {booking.profiles.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={booking.status === 'confirmed' ? 'success' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {!isCancelled && (
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleSendReminder}>
                <Bell className="w-4 h-4 mr-2" />
                Send Reminder
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Cancel Inspection
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this inspection?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will notify all registered attendees that the inspection has been cancelled.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Inspection</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onCancel(inspection.id);
                        onOpenChange(false);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Inspection
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {isCancelled && (
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive font-medium text-center">
                This inspection has been cancelled
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
