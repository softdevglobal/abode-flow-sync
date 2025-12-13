import { useState } from 'react';
import { ViewingRequest, Property } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, MessageSquare, Check, X, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { mockCustomerNames, mockProperties } from '@/data/mockData';

interface ViewingRequestCardProps {
  request: ViewingRequest;
  isAgent?: boolean;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCounterPropose?: (id: string) => void;
}

export function ViewingRequestCard({ 
  request, 
  isAgent = false,
  onAccept,
  onDecline,
  onCounterPropose
}: ViewingRequestCardProps) {
  const property = mockProperties.find(p => p.id === request.propertyId);
  const customerName = mockCustomerNames[request.customerId] || 'Unknown Customer';

  const statusConfig = {
    pending: { variant: 'pending' as const, label: 'Pending' },
    accepted: { variant: 'accepted' as const, label: 'Accepted' },
    declined: { variant: 'declined' as const, label: 'Declined' },
    counter_proposed: { variant: 'warning' as const, label: 'Counter Proposed' },
    confirmed: { variant: 'success' as const, label: 'Confirmed' },
  };

  const config = statusConfig[request.status];

  return (
    <Card variant="interactive">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground line-clamp-1">
              {property?.title || 'Property'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {property?.address}, {property?.suburb}
            </p>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(request.requestedDate, 'EEE, MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{request.requestedTime}</span>
          </div>
        </div>

        {request.message && (
          <div className="bg-secondary rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-foreground">{request.message}</p>
            </div>
          </div>
        )}

        {request.status === 'counter_proposed' && request.proposedDate && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-warning mb-1">Alternative Proposed:</p>
            <p className="text-sm text-foreground">
              {format(request.proposedDate, 'EEE, MMM d, yyyy')} at {request.proposedTime}
            </p>
            {request.agentNotes && (
              <p className="text-xs text-muted-foreground mt-2">{request.agentNotes}</p>
            )}
          </div>
        )}

        {isAgent && request.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button 
              variant="success" 
              size="sm" 
              className="flex-1"
              onClick={() => onAccept?.(request.id)}
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onCounterPropose?.(request.id)}
            >
              <CalendarPlus className="w-4 h-4 mr-1" />
              Propose
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDecline?.(request.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
