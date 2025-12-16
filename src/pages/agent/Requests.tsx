import { AgentLayout } from '@/components/layout/AgentLayout';
import { ViewingRequestCard } from '@/components/viewing/ViewingRequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockViewingRequests } from '@/data/mockData';
import { toast } from 'sonner';
import { Calendar, Inbox } from 'lucide-react';

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
    <AgentLayout>
      <main className="container px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Viewing Requests
          </h1>
          <p className="text-muted-foreground font-body">
            Manage customer viewing requests for your properties
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-card/50 backdrop-blur-sm border border-border/50 p-1 rounded-xl">
            <TabsTrigger 
              value="pending" 
              className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              Pending
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-primary/20 text-primary data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              All Requests
            </TabsTrigger>
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
              <div className="text-center py-16 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Inbox className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">No pending requests</h3>
                <p className="text-muted-foreground font-body">
                  New viewing requests from customers will appear here
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {mockViewingRequests.length > 0 ? (
              mockViewingRequests.map((request) => (
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
              <div className="text-center py-16 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">No requests yet</h3>
                <p className="text-muted-foreground font-body">
                  Viewing requests from customers will appear here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </AgentLayout>
  );
}