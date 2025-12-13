import { Header, MobileNav } from '@/components/layout/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, QrCode, Plus } from 'lucide-react';
import { mockInspections, mockProperties } from '@/data/mockData';
import { format } from 'date-fns';

export default function AgentInspections() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header userRole="agent" />

      <main className="container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Inspections
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your property inspections
            </p>
          </div>
          <Button variant="gold">
            <Plus className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </div>

        <div className="space-y-4">
          {mockInspections.map((inspection) => {
            const property = mockProperties.find(p => p.id === inspection.propertyId);
            
            return (
              <Card key={inspection.id} variant="elevated">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-foreground line-clamp-1">
                        {property?.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{property?.address}, {property?.suburb}</span>
                      </div>
                    </div>
                    <Badge variant={inspection.isPrivate ? 'outline' : 'success'}>
                      {inspection.isPrivate ? 'Private' : 'Open'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{format(inspection.date, 'EEE, MMM d')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{inspection.startTime} - {inspection.endTime}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <QrCode className="w-4 h-4 mr-2" />
                      View QR Code
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      Attendees (0)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <MobileNav userRole="agent" />
    </div>
  );
}
