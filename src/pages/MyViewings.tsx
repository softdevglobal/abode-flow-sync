import { Header, MobileNav } from '@/components/layout/MobileNav';
import { ViewingRequestCard } from '@/components/viewing/ViewingRequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

// Customer's viewing requests
const customerViewings = [
  {
    id: 'cv-1',
    propertyId: 'prop-1',
    customerId: 'customer-me',
    agentId: 'agent-1',
    requestedDate: new Date('2024-01-20'),
    requestedTime: '10:00 AM',
    status: 'pending' as const,
    message: 'Very interested in viewing this property.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'cv-2',
    propertyId: 'prop-2',
    customerId: 'customer-me',
    agentId: 'agent-1',
    requestedDate: new Date('2024-01-18'),
    requestedTime: '2:00 PM',
    status: 'accepted' as const,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: 'cv-3',
    propertyId: 'prop-3',
    customerId: 'customer-me',
    agentId: 'agent-1',
    requestedDate: new Date('2024-01-19'),
    requestedTime: '11:00 AM',
    proposedDate: new Date('2024-01-21'),
    proposedTime: '3:00 PM',
    status: 'counter_proposed' as const,
    agentNotes: 'Sorry, that time slot is unavailable. Would the proposed alternative work?',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
];

export default function MyViewings() {
  const upcomingViewings = customerViewings.filter(
    v => v.status === 'accepted'
  );
  const pendingViewings = customerViewings.filter(
    v => v.status === 'pending' || v.status === 'counter_proposed'
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header userRole="customer" />

      <main className="container px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            My Viewings
          </h1>
          <p className="text-muted-foreground text-sm">
            Track your property viewing requests
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
              {pendingViewings.length > 0 && (
                <span className="bg-warning text-warning-foreground text-xs rounded-full px-2 py-0.5">
                  {pendingViewings.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingViewings.length > 0 ? (
              upcomingViewings.map((viewing) => (
                <ViewingRequestCard key={viewing.id} request={viewing} />
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No upcoming viewings</h3>
                <p className="text-muted-foreground text-sm">
                  Your confirmed viewings will appear here
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingViewings.length > 0 ? (
              pendingViewings.map((viewing) => (
                <ViewingRequestCard key={viewing.id} request={viewing} />
              ))
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No pending requests</h3>
                <p className="text-muted-foreground text-sm">
                  Request a viewing from any property listing
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav userRole="customer" />
    </div>
  );
}
