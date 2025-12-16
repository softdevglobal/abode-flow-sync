import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Clock, CheckCircle2, MapPin, Loader2, 
  LogIn, MessageSquare, CalendarPlus, Home
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

type ViewingRequestStatus = 'pending' | 'accepted' | 'declined' | 'counter_proposed' | 'confirmed' | 'cancelled';

interface ViewingRequest {
  id: string;
  property_id: string;
  customer_id: string;
  agent_id: string;
  requested_date: string;
  requested_time: string;
  message: string | null;
  status: ViewingRequestStatus;
  proposed_date: string | null;
  proposed_time: string | null;
  agent_notes: string | null;
  created_at: string;
  property: {
    id: string;
    title: string;
    address: string;
    suburb: string;
    state: string;
    images: string[] | null;
  } | null;
}

export default function MyViewings() {
  const { user, loading: authLoading } = useAuth();

  const { data: viewingRequests = [], isLoading } = useQuery({
    queryKey: ['viewing-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('viewing_requests')
        .select(`
          id,
          property_id,
          customer_id,
          agent_id,
          requested_date,
          requested_time,
          message,
          status,
          proposed_date,
          proposed_time,
          agent_notes,
          created_at,
          property:properties(
            id,
            title,
            address,
            suburb,
            state,
            images
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ViewingRequest[];
    },
    enabled: !!user?.id,
  });

  const upcomingViewings = viewingRequests.filter(
    (v) => v.status === 'accepted' || v.status === 'confirmed'
  );
  const pendingViewings = viewingRequests.filter(
    (v) => v.status === 'pending' || v.status === 'counter_proposed'
  );

  const getStatusBadge = (status: ViewingRequestStatus) => {
    const config: Record<ViewingRequestStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      pending: { variant: 'secondary', label: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
      accepted: { variant: 'default', label: 'Accepted', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      declined: { variant: 'destructive', label: 'Declined' },
      counter_proposed: { variant: 'secondary', label: 'Counter Proposed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      confirmed: { variant: 'default', label: 'Confirmed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      cancelled: { variant: 'secondary', label: 'Cancelled' },
    };
    const { variant, label, className } = config[status];
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

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
              <h2 className="text-xl font-semibold mb-2">Sign in to view your viewings</h2>
              <p className="text-muted-foreground mb-6">
                Track your property viewing requests and upcoming inspections.
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
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            My Viewings
          </h1>
          <p className="text-muted-foreground text-sm">
            Track your property viewing requests
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Upcoming ({upcomingViewings.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending
                {pendingViewings.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
                    {pendingViewings.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingViewings.length > 0 ? (
                upcomingViewings.map((viewing) => (
                  <ViewingCard key={viewing.id} viewing={viewing} getStatusBadge={getStatusBadge} />
                ))
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming viewings"
                  description="Your confirmed viewings will appear here"
                />
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingViewings.length > 0 ? (
                pendingViewings.map((viewing) => (
                  <ViewingCard key={viewing.id} viewing={viewing} getStatusBadge={getStatusBadge} />
                ))
              ) : (
                <EmptyState
                  icon={Clock}
                  title="No pending requests"
                  description="Request a viewing from any property listing"
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </BuyerLayout>
  );
}

function ViewingCard({ 
  viewing, 
  getStatusBadge 
}: { 
  viewing: ViewingRequest; 
  getStatusBadge: (status: ViewingRequestStatus) => JSX.Element;
}) {
  const property = viewing.property;

  return (
    <Card className="overflow-hidden">
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
              {getStatusBadge(viewing.status)}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(parseISO(viewing.requested_date), 'EEE, MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{viewing.requested_time}</span>
              </div>
            </div>

            {viewing.message && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="flex items-start gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                  <p className="text-xs text-muted-foreground line-clamp-2">{viewing.message}</p>
                </div>
              </div>
            )}

            {viewing.status === 'counter_proposed' && viewing.proposed_date && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  <CalendarPlus className="w-3 h-3 inline mr-1" />
                  Alternative Proposed:
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {format(parseISO(viewing.proposed_date), 'EEE, MMM d, yyyy')} at {viewing.proposed_time}
                </p>
                {viewing.agent_notes && (
                  <p className="text-xs text-muted-foreground mt-1">{viewing.agent_notes}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      <Button asChild variant="outline">
        <Link to="/browse">Browse Properties</Link>
      </Button>
    </div>
  );
}
