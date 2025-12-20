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
  User,
  Home,
  ImageIcon,
  Pencil,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreateAppraisalDialog } from '@/components/appraisal/CreateAppraisalDialog';
import { EditAppraisalDialog } from '@/components/appraisal/EditAppraisalDialog';
import { DeleteAppraisalDialog } from '@/components/appraisal/DeleteAppraisalDialog';
import { AppraisalFormData } from '@/components/appraisal/AppraisalForm';

// Demo agent ID for prototype
const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

interface Appraisal {
  id: string;
  headline: string | null;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  land_size: number | null;
  price_from: number;
  price_to: number;
  confidence: string;
  is_public: boolean;
  notes: string | null;
  images: string[] | null;
  created_at: string;
}

export default function AgentAppraisals() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('requests');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAppraisal, setEditingAppraisal] = useState<Appraisal | null>(null);
  const [deletingAppraisal, setDeletingAppraisal] = useState<Appraisal | null>(null);

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
      return (data || []) as Appraisal[];
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

  const getPropertyTypeLabel = (type: string | null) => {
    if (!type) return 'House';
    const labels: Record<string, string> = {
      house: 'House',
      unit: 'Unit',
      townhouse: 'Townhouse',
      land: 'Land',
      rural: 'Rural',
    };
    return labels[type] || type;
  };

  // Create appraisal mutation
  const createAppraisal = useMutation({
    mutationFn: async (data: AppraisalFormData) => {
      const { error } = await supabase
        .from('appraisals')
        .insert({
          agent_id: DEMO_AGENT_ID,
          headline: data.headline || null,
          address: data.address,
          suburb: data.suburb,
          state: data.state,
          postcode: data.postcode,
          property_type: data.property_type,
          bedrooms: data.bedrooms || null,
          bathrooms: data.bathrooms || null,
          parking: data.parking || null,
          land_size: data.land_size || null,
          price_from: data.price_from,
          price_to: data.price_to,
          confidence: data.confidence,
          is_public: data.is_public,
          notes: data.notes || null,
          images: data.images || [],
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

  // Update appraisal mutation
  const updateAppraisal = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AppraisalFormData }) => {
      const { error } = await supabase
        .from('appraisals')
        .update({
          headline: data.headline || null,
          address: data.address,
          suburb: data.suburb,
          state: data.state,
          postcode: data.postcode,
          property_type: data.property_type,
          bedrooms: data.bedrooms || null,
          bathrooms: data.bathrooms || null,
          parking: data.parking || null,
          land_size: data.land_size || null,
          price_from: data.price_from,
          price_to: data.price_to,
          confidence: data.confidence,
          is_public: data.is_public,
          notes: data.notes || null,
          images: data.images || [],
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-appraisals'] });
      queryClient.invalidateQueries({ queryKey: ['public-appraisals'] });
      setEditingAppraisal(null);
      toast.success('Appraisal updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update appraisal: ' + error.message);
    },
  });

  // Delete appraisal mutation
  const deleteAppraisal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appraisals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-appraisals'] });
      queryClient.invalidateQueries({ queryKey: ['public-appraisals'] });
      setDeletingAppraisal(null);
      toast.success('Appraisal deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete appraisal: ' + error.message);
    },
  });

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;

  const handleEditClick = (appraisal: Appraisal) => {
    setEditingAppraisal(appraisal);
  };

  const handleDeleteClick = (appraisal: Appraisal) => {
    setDeletingAppraisal(appraisal);
  };

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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {appraisals.map((appraisal) => (
                  <Card key={appraisal.id} className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:border-primary/30 transition-colors overflow-hidden group">
                    {/* Image */}
                    {appraisal.images && appraisal.images.length > 0 ? (
                      <div className="aspect-[16/10] relative">
                        <img
                          src={appraisal.images[0]}
                          alt={appraisal.address}
                          className="w-full h-full object-cover"
                        />
                        {appraisal.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {appraisal.images.length}
                          </div>
                        )}
                        <Badge 
                          variant={appraisal.is_public ? 'default' : 'secondary'}
                          className="absolute top-2 left-2"
                        >
                          {appraisal.is_public ? 'Public' : 'Private'}
                        </Badge>
                        {/* Actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(appraisal)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(appraisal)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-muted/50 flex items-center justify-center relative">
                        <Home className="w-12 h-12 text-muted-foreground/50" />
                        <Badge 
                          variant={appraisal.is_public ? 'default' : 'secondary'}
                          className="absolute top-2 left-2"
                        >
                          {appraisal.is_public ? 'Public' : 'Private'}
                        </Badge>
                        {/* Actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(appraisal)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(appraisal)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    <CardContent className="pt-4">
                      {/* Property Type Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getPropertyTypeLabel(appraisal.property_type)}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${confidenceColors[appraisal.confidence as keyof typeof confidenceColors]}`}
                        >
                          {appraisal.confidence} confidence
                        </Badge>
                      </div>

                      {/* Headline */}
                      {appraisal.headline && (
                        <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-1">
                          {appraisal.headline}
                        </h3>
                      )}

                      {/* Address */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{appraisal.address}, {appraisal.suburb}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-accent" />
                        <span className="font-display font-bold text-foreground">
                          {formatCurrency(Number(appraisal.price_from))} - {formatCurrency(Number(appraisal.price_to))}
                        </span>
                      </div>

                      {/* Features */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {appraisal.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-4 h-4" /> {appraisal.bedrooms}
                          </span>
                        )}
                        {appraisal.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-4 h-4" /> {appraisal.bathrooms}
                          </span>
                        )}
                        {appraisal.parking && (
                          <span className="flex items-center gap-1">
                            <Car className="w-4 h-4" /> {appraisal.parking}
                          </span>
                        )}
                        {appraisal.land_size && (
                          <span className="flex items-center gap-1">
                            <Ruler className="w-4 h-4" /> {appraisal.land_size}m²
                          </span>
                        )}
                      </div>

                      {/* Created date */}
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                        Created {new Date(appraisal.created_at).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <CreateAppraisalDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={(data) => createAppraisal.mutate(data)}
          isSubmitting={createAppraisal.isPending}
        />

        {/* Edit Dialog */}
        <EditAppraisalDialog
          open={!!editingAppraisal}
          onOpenChange={(open) => !open && setEditingAppraisal(null)}
          onSubmit={(data) => editingAppraisal && updateAppraisal.mutate({ id: editingAppraisal.id, data })}
          isSubmitting={updateAppraisal.isPending}
          appraisal={editingAppraisal ? {
            headline: editingAppraisal.headline || undefined,
            address: editingAppraisal.address,
            suburb: editingAppraisal.suburb,
            state: editingAppraisal.state,
            postcode: editingAppraisal.postcode,
            property_type: editingAppraisal.property_type || 'house',
            bedrooms: editingAppraisal.bedrooms || undefined,
            bathrooms: editingAppraisal.bathrooms || undefined,
            parking: editingAppraisal.parking || undefined,
            land_size: editingAppraisal.land_size || undefined,
            price_from: editingAppraisal.price_from,
            price_to: editingAppraisal.price_to,
            confidence: editingAppraisal.confidence as 'low' | 'medium' | 'high',
            is_public: editingAppraisal.is_public,
            notes: editingAppraisal.notes || undefined,
            images: editingAppraisal.images || [],
          } : null}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteAppraisalDialog
          open={!!deletingAppraisal}
          onOpenChange={(open) => !open && setDeletingAppraisal(null)}
          onConfirm={() => deletingAppraisal && deleteAppraisal.mutate(deletingAppraisal.id)}
          isDeleting={deleteAppraisal.isPending}
          appraisalAddress={deletingAppraisal?.address}
        />
      </div>
    </AgentLayout>
  );
}
