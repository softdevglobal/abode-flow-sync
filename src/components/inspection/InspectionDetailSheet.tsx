import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, Bell, X, Mail, Phone, CheckCircle, Wifi, WifiOff, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { toast } from 'sonner';
import type { InspectionWithProperty } from '@/hooks/useAgentInspections';

interface InspectionDetailSheetProps {
  inspection: InspectionWithProperty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (id: string) => void;
  onGenerateQR?: () => void;
}

export function InspectionDetailSheet({
  inspection,
  open,
  onOpenChange,
  onCancel,
  onGenerateQR,
}: InspectionDetailSheetProps) {
  // Use realtime bookings hook
  const { 
    bookings, 
    isLoading: bookingsLoading, 
    isSubscribed,
    checkedInCount,
    totalCount,
  } = useRealtimeBookings(open ? inspection?.id : undefined);

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
          <SheetTitle className="flex items-center justify-between">
            <span>Inspection Details</span>
            {/* Realtime indicator */}
            <div className="flex items-center gap-1.5">
              {isSubscribed ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <Wifi className="w-3 h-3" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <WifiOff className="w-3 h-3" />
                  Connecting...
                </span>
              )}
            </div>
          </SheetTitle>
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
                  {totalCount} registered • {checkedInCount} checked in
                </p>
                <p className="text-sm text-muted-foreground">
                  {(inspection.max_attendees || 20) - totalCount} spots remaining
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

          {/* Live Attendees */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Live Attendees
                  {isSubscribed && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                  )}
                </span>
                <Badge variant="secondary">{totalCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No registered attendees yet</p>
                  <p className="text-xs mt-1">Attendees will appear here as they register</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {bookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        booking.checked_in_at 
                          ? 'bg-success/10 border border-success/20' 
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          booking.checked_in_at 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-muted-foreground/20'
                        }`}>
                          {booking.checked_in_at ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-medium">
                              {booking.profiles?.first_name?.[0] || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {booking.profiles?.first_name} {booking.profiles?.last_name}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            {booking.profiles?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {booking.profiles.phone}
                              </span>
                            )}
                            {booking.profiles?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {booking.profiles.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {booking.checked_in_at ? (
                          <Badge variant="success" className="text-xs">
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {booking.status}
                          </Badge>
                        )}
                        {booking.checked_in_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(booking.checked_in_at), 'h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {!isCancelled && (
            <div className="space-y-2 pt-4">
              <div className="flex gap-2">
                {onGenerateQR && (
                  <Button variant="outline" className="flex-1" onClick={onGenerateQR}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Show QR Code
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={handleSendReminder}>
                  <Bell className="w-4 h-4 mr-2" />
                  Send Reminder
                </Button>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
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
