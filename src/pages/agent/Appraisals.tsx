import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  FileText, 
  DollarSign, 
  MapPin, 
  Loader2, 
  Inbox,
  Clock,
  CheckCircle,
  Phone,
  Bed,
  Bath,
  Car,
  Ruler,
  MessageSquare,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreateAppraisalDialog } from '@/components/appraisal/CreateAppraisalDialog';
import { AppraisalFormData } from '@/components/appraisal/AppraisalForm';

// Demo agent ID for prototype
const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

export default function AgentAppraisals() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('requests');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch agent's appraisals
  const { data: appraisals = [], isLoading: appraisalsLoading } = useQuery({
    queryKey: ['agent-appraisals', DEMO_AGENT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appraisals')
        .select('*')
        .eq('agent_id', DEMO_AGENT_ID)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch buyer appraisal requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['appraisal-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appraisal_requests')
        .select(`
          *,
          profiles:customer_id (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Update request status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('appraisal_requests')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appraisal-requests'] });
      toast.success('Request status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const confidenceColors = {
    low: 'text-destructive',
    medium: 'text-yellow-500',
    high: 'text-green-500',
  };

  const statusConfig = {
    pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
    contacted: { label: 'Contacted', variant: 'default' as const, icon: Phone },
    completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle },
  };

  const getCustomerName = (profile: any) => {
    if (!profile) return 'Unknown';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName} ${lastName}`.trim() || profile.email || 'Unknown';
  };

  // Create appraisal mutation
  const createAppraisal = useMutation({
    mutationFn: async (data: AppraisalFormData) => {
      const { error } = await supabase
        .from('appraisals')
        .insert({
          agent_id: DEMO_AGENT_ID,
          address: data.address,
          suburb: data.suburb,
          state: data.state,
          postcode: data.postcode,
          price_from: data.price_from,
          price_to: data.price_to,
          confidence: data.confidence,
          is_public: data.is_public,
          notes: data.notes || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-appraisals'] });
      setShowCreateDialog(false);
      setActiveTab('appraisals');
      toast.success('Appraisal created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create appraisal: ' + error.message);
    },
  });

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;

  return (
    <AgentLayout>
      <div className="container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Appraisals
            </h1>
            <p className="text-muted-foreground text-sm font-body">
              Manage appraisals and buyer requests
            </p>
          </div>
          <Button className="shadow-glow-sm font-body" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Appraisal
          </Button>
        </div>

        {/* Disclaimer */}
        <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-body">
              <strong className="text-primary">Disclaimer:</strong> Appraisals are indicative only and not a formal valuation. 
              These estimates are based on comparable sales and market conditions at the time of assessment. 
              For legal or financial purposes, please obtain a licensed valuation.
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="requests" className="relative">
              Buyer Requests
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="appraisals">My Appraisals</TabsTrigger>
          </TabsList>

          {/* Buyer Requests Tab */}
          <TabsContent value="requests">
            {requestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
                <CardContent className="py-12 text-center">
                  <Inbox className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-display text-lg font-semibold mb-2">No Appraisal Requests</h3>
                  <p className="text-muted-foreground text-sm font-body">
                    Buyer appraisal requests will appear here when submitted.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request: any) => {
                  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card key={request.id} className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:border-primary/30 transition-colors">
                      <CardContent className="pt-5">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Customer Info */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-display font-semibold text-foreground">
                                {getCustomerName(request.profiles)}
                              </span>
                              <Badge variant={status.variant} className="flex items-center gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                            </div>
                            
                            {request.profiles?.email && (
                              <p className="text-sm text-muted-foreground mb-1">
                                {request.profiles.email}
                              </p>
                            )}
                            {request.profiles?.phone && (
                              <p className="text-sm text-muted-foreground mb-3">
                                <Phone className="w-3 h-3 inline mr-1" />
                                {request.profiles.phone}
                              </p>
                            )}

                            {/* Property Details */}
                            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 mb-3">
                              <div className="flex items-center gap-2 text-sm mb-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="font-medium">{request.address}, {request.suburb} {request.state} {request.postcode}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="capitalize">{request.property_type}</span>
                                {request.bedrooms && (
                                  <span className="flex items-center gap-1">
                                    <Bed className="w-4 h-4" /> {request.bedrooms}
                                  </span>
                                )}
                                {request.bathrooms && (
                                  <span className="flex items-center gap-1">
                                    <Bath className="w-4 h-4" /> {request.bathrooms}
                                  </span>
                                )}
                                {request.parking && (
                                  <span className="flex items-center gap-1">
                                    <Car className="w-4 h-4" /> {request.parking}
                                  </span>
                                )}
                                {request.land_size && (
                                  <span className="flex items-center gap-1">
                                    <Ruler className="w-4 h-4" /> {request.land_size}m²
                                  </span>
                                )}
                              </div>
                              {request.notes && (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{request.notes}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions & Timestamp */}
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                Submitted {new Date(request.created_at).toLocaleDateString('en-AU', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <div className="flex items-center gap-2">
                                {request.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatus.mutate({ id: request.id, status: 'contacted' })}
                                    disabled={updateStatus.isPending}
                                  >
                                    <Phone className="w-4 h-4 mr-1" />
                                    Mark Contacted
                                  </Button>
                                )}
                                {request.status === 'contacted' && (
                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => updateStatus.mutate({ id: request.id, status: 'completed' })}
                                    disabled={updateStatus.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Mark Completed
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Appraisals Tab */}
          <TabsContent value="appraisals">
            {appraisalsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : appraisals.length === 0 ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-display text-lg font-semibold mb-2">No Appraisals Yet</h3>
                  <p className="text-muted-foreground text-sm font-body mb-4">
                    Create your first property appraisal to get started.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Appraisal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appraisals.map((appraisal: any) => (
                  <Card key={appraisal.id} className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:border-primary/30 transition-colors">
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 font-body">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="truncate">{appraisal.address}, {appraisal.suburb} {appraisal.state} {appraisal.postcode}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-primary" />
                            <span className="font-display text-lg font-bold">
                              {formatCurrency(Number(appraisal.price_from))} - {formatCurrency(Number(appraisal.price_to))}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground font-body">Confidence:</span>
                              <span className={`text-sm font-medium capitalize font-body ${confidenceColors[appraisal.confidence as keyof typeof confidenceColors]}`}>
                                {appraisal.confidence}
                              </span>
                            </div>
                            <Badge variant={appraisal.is_public ? 'default' : 'secondary'}>
                              {appraisal.is_public ? 'Public' : 'Private'}
                            </Badge>
                          </div>
                          {appraisal.notes && (
                            <p className="text-sm text-muted-foreground bg-muted/30 border border-border/50 rounded-xl p-3 font-body">
                              {appraisal.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {new Date(appraisal.created_at).toLocaleDateString('en-AU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CreateAppraisalDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={(data) => createAppraisal.mutate(data)}
          isSubmitting={createAppraisal.isPending}
        />
      </div>
    </AgentLayout>
  );
}
