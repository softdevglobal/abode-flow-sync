import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAppraisalInterests } from '@/hooks/useAppraisalInterests';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Calendar, 
  Inbox, 
  DollarSign, 
  Home, 
  Phone, 
  Mail, 
  MessageSquare,
  CheckCircle,
  Clock,
  Eye,
  User,
  TrendingUp,
  Bed,
  Bath,
  Car
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

// Viewing request type
interface ViewingRequest {
  id: string;
  property_id: string;
  customer_id: string;
  status: string;
  requested_date: string;
  requested_time: string;
  message: string | null;
  created_at: string;
  property: {
    title: string;
    address: string;
    suburb: string;
  };
  customer: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
}

export default function AgentRequests() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('interests');
  
  // Fetch viewing requests
  const { data: viewingRequests = [], isLoading: viewingLoading } = useQuery({
    queryKey: ['viewing-requests', DEMO_AGENT_ID],
    queryFn: async (): Promise<ViewingRequest[]> => {
      const { data, error } = await supabase
        .from('viewing_requests')
        .select(`
          id,
          property_id,
          customer_id,
          status,
          requested_date,
          requested_time,
          message,
          created_at
        `)
        .eq('agent_id', DEMO_AGENT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Get property details
      const propertyIds = [...new Set(data.map(r => r.property_id))];
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, address, suburb')
        .in('id', propertyIds);

      const propertyMap = new Map(properties?.map(p => [p.id, p]) || []);

      // Get customer details
      const customerIds = [...new Set(data.map(r => r.customer_id))];
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone')
        .in('id', customerIds);

      const customerMap = new Map(customers?.map(c => [c.id, c]) || []);

      return data.map(request => ({
        ...request,
        property: propertyMap.get(request.property_id) || { title: 'Unknown', address: '', suburb: '' },
        customer: customerMap.get(request.customer_id) || { email: 'Unknown', first_name: null, last_name: null, phone: null },
      }));
    },
  });

  // Fetch appraisal interests
  const { interests, isLoading: interestsLoading, updateStatus, isUpdating } = useAppraisalInterests(DEMO_AGENT_ID);

  // Update viewing request status
  const updateViewingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'declined' | 'pending' | 'confirmed' | 'cancelled' | 'counter_proposed' }) => {
      const { error } = await supabase
        .from('viewing_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viewing-requests', DEMO_AGENT_ID] });
      toast.success('Viewing request updated');
    },
  });

  const handleAcceptViewing = (id: string) => {
    updateViewingMutation.mutate({ id, status: 'accepted' });
  };

  const handleDeclineViewing = (id: string) => {
    updateViewingMutation.mutate({ id, status: 'declined' });
  };

  const handleMarkContacted = async (interestId: string) => {
    try {
      await updateStatus({ interestId, status: 'contacted' });
      toast.success('Marked as contacted');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const pendingInterests = interests.filter(i => i.status === 'pending');
  const pendingViewings = viewingRequests.filter(r => r.status === 'pending');

  const formatPrice = (from: number, to: number) => {
    const formatNum = (n: number) => {
      if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
      return `$${n}`;
    };
    return `${formatNum(from)} - ${formatNum(to)}`;
  };

  const getCustomerName = (customer: { first_name: string | null; last_name: string | null; email: string }) => {
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }
    return customer.email;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/30">Pending</Badge>;
      case 'contacted':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 border-blue-500/30">Contacted</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">Accepted</Badge>;
      case 'declined':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-600 border-red-500/30">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AgentLayout>
      <main className="container px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Requests
          </h1>
          <p className="text-muted-foreground font-body">
            Manage buyer interest and viewing requests
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-card/50 backdrop-blur-sm border border-border/50 p-1 rounded-xl">
            <TabsTrigger 
              value="interests" 
              className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Pre-Market Interests
              {pendingInterests.length > 0 && (
                <span className="ml-2 bg-primary/20 text-primary data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium">
                  {pendingInterests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="viewings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all gap-2"
            >
              <Eye className="w-4 h-4" />
              Viewing Requests
              {pendingViewings.length > 0 && (
                <span className="ml-2 bg-primary/20 text-primary data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium">
                  {pendingViewings.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pre-Market Interests Tab */}
          <TabsContent value="interests" className="space-y-4">
            {interestsLoading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : interests.length > 0 ? (
              interests.map((interest) => (
                <Card key={interest.id} className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Property Image */}
                      <div className="md:w-48 h-32 md:h-auto bg-muted relative shrink-0">
                        {interest.appraisal.images?.[0] ? (
                          <img 
                            src={interest.appraisal.images[0]} 
                            alt={interest.appraisal.address}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          {getStatusBadge(interest.status)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Customer & Property Info */}
                          <div className="flex-1 space-y-3">
                            {/* Customer */}
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                  {(interest.customer.first_name?.[0] || interest.customer.email[0]).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground font-display">
                                  {getCustomerName(interest.customer)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(interest.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>

                            {/* Property */}
                            <div className="pl-13">
                              <p className="text-sm text-foreground font-medium">
                                {interest.appraisal.address}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {interest.appraisal.suburb}, {interest.appraisal.state} {interest.appraisal.postcode}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                {interest.appraisal.bedrooms && (
                                  <span className="flex items-center gap-1">
                                    <Bed className="w-3 h-3" /> {interest.appraisal.bedrooms}
                                  </span>
                                )}
                                {interest.appraisal.bathrooms && (
                                  <span className="flex items-center gap-1">
                                    <Bath className="w-3 h-3" /> {interest.appraisal.bathrooms}
                                  </span>
                                )}
                                {interest.appraisal.parking && (
                                  <span className="flex items-center gap-1">
                                    <Car className="w-3 h-3" /> {interest.appraisal.parking}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Message */}
                            {interest.message && (
                              <div className="pl-13 bg-muted/50 rounded-lg p-3 mt-2">
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                  <p className="text-sm text-muted-foreground italic">
                                    "{interest.message}"
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Side - Price & Actions */}
                          <div className="flex flex-col items-end gap-3">
                            {/* Offer Amount */}
                            {interest.offer_amount && (
                              <div className="bg-green-500/10 rounded-lg px-4 py-2 text-right">
                                <p className="text-xs text-muted-foreground">Offer Amount</p>
                                <p className="text-lg font-bold text-green-600 font-display flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  {interest.offer_amount.toLocaleString()}
                                </p>
                              </div>
                            )}

                            {/* Price Range */}
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Guide Price</p>
                              <p className="text-sm font-semibold text-foreground">
                                {formatPrice(interest.appraisal.price_from, interest.appraisal.price_to)}
                              </p>
                            </div>

                            {/* Contact Buttons */}
                            <div className="flex items-center gap-2">
                              {interest.customer.phone && (
                                <Button size="sm" variant="outline" className="gap-2" asChild>
                                  <a href={`tel:${interest.customer.phone}`}>
                                    <Phone className="w-4 h-4" />
                                    Call
                                  </a>
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="gap-2" asChild>
                                <a href={`mailto:${interest.customer.email}`}>
                                  <Mail className="w-4 h-4" />
                                  Email
                                </a>
                              </Button>
                              {interest.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  className="gap-2"
                                  onClick={() => handleMarkContacted(interest.id)}
                                  disabled={isUpdating}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Mark Contacted
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-16 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">No buyer interests yet</h3>
                <p className="text-muted-foreground font-body">
                  When buyers express interest in your pre-market listings, they'll appear here
                </p>
              </div>
            )}
          </TabsContent>

          {/* Viewing Requests Tab */}
          <TabsContent value="viewings" className="space-y-4">
            {viewingLoading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : viewingRequests.length > 0 ? (
              viewingRequests.map((request) => (
                <Card key={request.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Customer & Property Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {(request.customer.first_name?.[0] || request.customer.email[0]).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground font-display">
                              {getCustomerName(request.customer)}
                            </p>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Home className="w-3 h-3 inline mr-1" />
                            {request.property.title}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(request.requested_date), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {request.requested_time}
                            </span>
                          </div>
                          {request.message && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              "{request.message}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {request.customer.phone && (
                          <Button size="sm" variant="outline" className="gap-2" asChild>
                            <a href={`tel:${request.customer.phone}`}>
                              <Phone className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-2" asChild>
                          <a href={`mailto:${request.customer.email}`}>
                            <Mail className="w-4 h-4" />
                          </a>
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeclineViewing(request.id)}
                              disabled={updateViewingMutation.isPending}
                            >
                              Decline
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleAcceptViewing(request.id)}
                              disabled={updateViewingMutation.isPending}
                            >
                              Accept
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-16 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Inbox className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">No viewing requests</h3>
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
