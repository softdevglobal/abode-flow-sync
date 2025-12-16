import { Header, MobileNav } from '@/components/layout/MobileNav';
import { ViewingRequestCard } from '@/components/viewing/ViewingRequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockViewingRequests } from '@/data/mockData';
import { toast } from 'sonner';

export default function AgentRequests() {
  const pendingRequests = mockViewingRequests.filter(r => r.status === 'pending');
  const otherRequests = mockViewingRequests.filter(r => r.status !== 'pending');

  const handleAccept = (id: string) => {
    toast.success('Viewing request accepted');
  };

  const handleDecline = (id: string) => {
    toast.success('Viewing request declined');
  };

  const handleCounterPropose = (id: string) => {
    toast.success('Counter proposal sent');
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header userRole="agent" />

      <main className="container px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            Viewing Requests
          </h1>
          <p className="text-muted-foreground text-sm font-body">
            Manage customer viewing requests
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-warning text-warning-foreground text-xs rounded-full px-2 py-0.5">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <ViewingRequestCard
                  key={request.id}
                  request={request}
                  isAgent
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onCounterPropose={handleCounterPropose}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {mockViewingRequests.map((request) => (
              <ViewingRequestCard
                key={request.id}
                request={request}
                isAgent
                onAccept={handleAccept}
                onDecline={handleDecline}
                onCounterPropose={handleCounterPropose}
              />
            ))}
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav userRole="agent" />
    </div>
  );
}
