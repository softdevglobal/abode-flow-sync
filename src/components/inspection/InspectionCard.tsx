import { format, isToday, isPast, isFuture } from 'date-fns';
import { Calendar, Clock, MapPin, Users, QrCode, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { InspectionWithProperty } from '@/hooks/useAgentInspections';

interface InspectionCardProps {
  inspection: InspectionWithProperty;
  onClick?: () => void;
  onGenerateQR?: () => void;
}

function getStatusBadge(inspection: InspectionWithProperty) {
  if (inspection.status === 'cancelled') {
    return { label: 'Cancelled', variant: 'destructive' as const };
  }
  
  const dateTime = new Date(inspection.date_time);
  
  if (isToday(dateTime)) {
    return { label: 'Today', variant: 'success' as const };
  }
  
  if (isPast(dateTime)) {
    return { label: 'Past', variant: 'secondary' as const };
  }
  
  return { label: 'Upcoming', variant: 'default' as const };
}

export function InspectionCard({ inspection, onClick, onGenerateQR }: InspectionCardProps) {
  const property = inspection.property;
  const dateTime = new Date(inspection.date_time);
  const endTime = new Date(dateTime.getTime() + inspection.duration * 60000);
  const status = getStatusBadge(inspection);
  const isUpcoming = isFuture(dateTime) || isToday(dateTime);
  const isCancelled = inspection.status === 'cancelled';
  const checkedInCount = inspection.checked_in_count || 0;

  const handleQRClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateQR?.();
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-primary/30 border-border/50 bg-card/50 backdrop-blur-sm",
        isCancelled && "opacity-60"
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex gap-4">
          {/* Property Image */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
            {property?.images?.[0] ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover rounded-l-xl"
              />
            ) : (
              <div className="w-full h-full bg-muted/50 rounded-l-xl flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 py-3 pr-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground line-clamp-1 font-display">
                  {property?.address || 'Unknown Property'}
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  {property?.suburb}, {property?.state} {property?.postcode}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {isUpcoming && !isCancelled && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 hover:border-primary/50 font-body"
                    onClick={handleQRClick}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">QR</span>
                  </Button>
                )}
                <Badge variant={status.variant} className="font-body">
                  {status.label}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-body">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{format(dateTime, 'EEE, MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span>{format(dateTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span>{inspection.current_attendees || 0} / {inspection.max_attendees}</span>
              </div>
              {checkedInCount > 0 && (
                <div className="flex items-center gap-1.5 text-green-400 font-medium">
                  <UserCheck className="w-4 h-4" />
                  <span>{checkedInCount} checked in</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
