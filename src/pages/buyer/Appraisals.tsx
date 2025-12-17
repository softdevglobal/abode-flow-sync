import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Home, Loader2, CheckCircle, Clock, MapPin, Bed, Bath, Car, Ruler } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function BuyerAppraisals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    address: '',
    suburb: '',
    state: 'NSW',
    postcode: '',
    property_type: 'house',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    land_size: '',
    notes: '',
  });

  // Fetch user's previous requests
  const { data: myRequests = [], refetch } = useQuery({
    queryKey: ['my-appraisal-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('appraisal_requests')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('appraisal_requests')
        .insert({
          customer_id: user.id,
          address: formData.address,
          suburb: formData.suburb,
          state: formData.state,
          postcode: formData.postcode,
          property_type: formData.property_type,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
          parking: formData.parking ? parseInt(formData.parking) : null,
          land_size: formData.land_size ? parseFloat(formData.land_size) : null,
          notes: formData.notes || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Appraisal request submitted! An agent will contact you soon.');
      setFormData({
        address: '',
        suburb: '',
        state: 'NSW',
        postcode: '',
        property_type: 'house',
        bedrooms: '',
        bathrooms: '',
        parking: '',
        land_size: '',
        notes: '',
      });
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to submit request: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      sessionStorage.setItem('redirectAfterAuth', '/appraisals');
      navigate('/auth');
      return;
    }
    
    if (!formData.address || !formData.suburb || !formData.postcode) {
      toast.error('Please fill in the required fields');
      return;
    }
    
    submitRequest.mutate();
  };

  const statusBadge = {
    pending: { label: 'Pending Review', variant: 'secondary' as const, icon: Clock },
    contacted: { label: 'Agent Contacted', variant: 'default' as const, icon: CheckCircle },
    completed: { label: 'Appraisal Complete', variant: 'success' as const, icon: CheckCircle },
  };

  return (
    <BuyerLayout>
      <div className="container px-4 py-6 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Get a Free Property Appraisal
          </h1>
          <p className="text-muted-foreground font-body max-w-xl mx-auto">
            Thinking of selling? Get a free, no-obligation appraisal from our experienced agents to understand your property's current market value.
          </p>
        </div>

        {/* Request Form */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl mb-8">
          <CardHeader>
            <CardTitle className="font-display text-lg">Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Address Section */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    placeholder="123 Example Street"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="suburb">Suburb *</Label>
                    <Input
                      id="suburb"
                      placeholder="Sydney"
                      value={formData.suburb}
                      onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NSW">NSW</SelectItem>
                        <SelectItem value="VIC">VIC</SelectItem>
                        <SelectItem value="QLD">QLD</SelectItem>
                        <SelectItem value="WA">WA</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                        <SelectItem value="TAS">TAS</SelectItem>
                        <SelectItem value="ACT">ACT</SelectItem>
                        <SelectItem value="NT">NT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input
                      id="postcode"
                      placeholder="2000"
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="property_type">Property Type</Label>
                  <Select value={formData.property_type} onValueChange={(v) => setFormData({ ...formData, property_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="rural">Rural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="bedrooms" className="flex items-center gap-1">
                      <Bed className="w-4 h-4" /> Bedrooms
                    </Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="0"
                      placeholder="3"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms" className="flex items-center gap-1">
                      <Bath className="w-4 h-4" /> Bathrooms
                    </Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      placeholder="2"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parking" className="flex items-center gap-1">
                      <Car className="w-4 h-4" /> Parking
                    </Label>
                    <Input
                      id="parking"
                      type="number"
                      min="0"
                      placeholder="2"
                      value={formData.parking}
                      onChange={(e) => setFormData({ ...formData, parking: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="land_size" className="flex items-center gap-1">
                      <Ruler className="w-4 h-4" /> Land (m²)
                    </Label>
                    <Input
                      id="land_size"
                      type="number"
                      min="0"
                      placeholder="600"
                      value={formData.land_size}
                      onChange={(e) => setFormData({ ...formData, land_size: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <Label htmlFor="notes">Additional Information</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional details about your property (renovations, features, etc.)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={submitRequest.isPending}
              >
                {submitRequest.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Request Free Appraisal'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl mb-8">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-body">
              <strong className="text-primary">Disclaimer:</strong> Appraisals are indicative only and not a formal valuation. 
              These estimates are based on comparable sales and market conditions at the time of assessment. 
              For legal or financial purposes, please obtain a licensed valuation.
            </p>
          </CardContent>
        </Card>

        {/* My Requests */}
        {user && myRequests.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-semibold mb-4">Your Appraisal Requests</h2>
            <div className="space-y-4">
              {myRequests.map((request: any) => {
                const status = statusBadge[request.status as keyof typeof statusBadge] || statusBadge.pending;
                const StatusIcon = status.icon;
                
                return (
                  <Card key={request.id} className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 font-body">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{request.address}, {request.suburb} {request.state} {request.postcode}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                            {request.bedrooms && <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {request.bedrooms}</span>}
                            {request.bathrooms && <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {request.bathrooms}</span>}
                            {request.parking && <span className="flex items-center gap-1"><Car className="w-4 h-4" /> {request.parking}</span>}
                            {request.land_size && <span className="flex items-center gap-1"><Ruler className="w-4 h-4" /> {request.land_size}m²</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Submitted {new Date(request.created_at).toLocaleDateString('en-AU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <Badge variant={status.variant} className="flex items-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
