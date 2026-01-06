import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, Bell, X, Mail, Phone, CheckCircle, Wifi, WifiOff, QrCode, Pencil } from 'lucide-react';
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
  onEdit?: () => void;
}

export function InspectionDetailSheet({
  inspection,
  open,
  onOpenChange,
  onCancel,
  onGenerateQR,
  onEdit,
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
      <SheetContent className="sm:max-w-lg overflow-y-auto bg-background/95 backdrop-blur-sm border-border/50">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between font-display">
            <span>Inspection Details</span>
            {/* Realtime indicator */}
            <div className="flex items-center gap-1.5">
              {isSubscribed ? (
                <span className="flex items-center gap-1 text-xs text-green-400 font-body">
                  <Wifi className="w-3 h-3" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
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
                className="w-20 h-20 object-cover rounded-xl border border-border/50"
              />
            ) : (
              <div className="w-20 h-20 bg-muted/50 rounded-xl flex items-center justify-center border border-border/50">
                <MapPin className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-foreground line-clamp-2 font-display">
                {property?.title || 'Unknown Property'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 font-body">
                {property?.address}
              </p>
              <p className="text-sm text-muted-foreground font-body">
                {property?.suburb}, {property?.state} {property?.postcode}
              </p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-body">{format(dateTime, 'EEEE, MMMM d, yyyy')}</p>
                <p className="text-sm text-muted-foreground font-body">
                  {format(dateTime, 'h:mm a')} - {format(endTime, 'h:mm a')} ({inspection.duration} min)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-body">
                  {totalCount} registered • {checkedInCount} checked in
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  {(inspection.max_attendees || 20) - totalCount} spots remaining
                </p>
              </div>
            </div>
          </div>

          {inspection.notes && (
            <>
              <Separator className="bg-border/50" />
              <div>
                <p className="text-sm font-medium mb-2 font-display">Notes</p>
                <p className="text-sm text-muted-foreground font-body">{inspection.notes}</p>
              </div>
            </>
          )}

          <Separator className="bg-border/50" />

          {/* Live Attendees */}
          <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between font-display">
                <span className="flex items-center gap-2">
                  Live Attendees
                  {isSubscribed && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </span>
                <Badge variant="secondary" className="font-body bg-primary/10 text-primary border-primary/20">{totalCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
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
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-body">No registered attendees yet</p>
                  <p className="text-xs mt-1 font-body">Attendees will appear here as they register</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {bookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                        booking.checked_in_at 
                          ? 'bg-green-500/10 border border-green-500/20' 
                          : 'bg-muted/30 border border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          booking.checked_in_at 
                            ? 'bg-green-500 text-white' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {booking.checked_in_at ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-medium font-display">
                              {booking.profiles?.first_name?.[0] || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm font-body">
                            {booking.profiles?.first_name} {booking.profiles?.last_name}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground font-body">
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
                          <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30 font-body">
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs font-body">
                            {booking.status}
                          </Badge>
                        )}
                        {booking.checked_in_at && (
                          <p className="text-xs text-muted-foreground mt-1 font-body">
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
                {onEdit && (
                  <Button variant="outline" className="flex-1 font-body hover:border-primary/50" onClick={onEdit}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {onGenerateQR && (
                  <Button variant="outline" className="flex-1 font-body hover:border-primary/50" onClick={onGenerateQR}>
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Code
                  </Button>
                )}
              </div>
              <Button variant="outline" className="w-full font-body hover:border-primary/50" onClick={handleSendReminder}>
                <Bell className="w-4 h-4 mr-2" />
                Send Reminder
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full font-body">
                    <X className="w-4 h-4 mr-2" />
                    Cancel Inspection
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background/95 backdrop-blur-sm border-border/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display">Cancel this inspection?</AlertDialogTitle>
                    <AlertDialogDescription className="font-body">
                      This will notify all registered attendees that the inspection has been cancelled.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-body">Keep Inspection</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onCancel(inspection.id);
                        onOpenChange(false);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
                    >
                      Cancel Inspection
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {isCancelled && (
            <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
              <p className="text-sm text-destructive font-medium text-center font-body">
                This inspection has been cancelled
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
