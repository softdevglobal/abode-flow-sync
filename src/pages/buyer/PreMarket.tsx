import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { SelectInspectionTimeModal } from '@/components/buyer/SelectInspectionTimeModal';
import { useBuyerInvitations } from '@/hooks/useInspectionInvitations';
import { 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Loader2, 
  Eye, 
  Send, 
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  Bed,
  Bath,
  Car,
  Ruler,
  ImageIcon,
  CalendarDays
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  notes: string | null;
  images: string[] | null;
  created_at: string;
  agent_id: string;
}

export default function PreMarket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);

  // Fetch buyer invitations
  const { invitations: buyerInvitations } = useBuyerInvitations(user?.id);

  const openLightbox = (images: string[], index: number = 0) => {
    setLightboxImages(images);
    setLightboxInitialIndex(index);
    setLightboxOpen(true);
  };

  // Get invitation for a specific appraisal
  const getInvitationForAppraisal = (appraisalId: string) => {
    return buyerInvitations.find(inv => inv.appraisal_id === appraisalId);
  };

  // Fetch public appraisals
  const { data: appraisals = [], isLoading } = useQuery({
    queryKey: ['public-appraisals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appraisals')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Appraisal[];
    },
  });

  // Fetch user's submitted interests
  const { data: myInterests = [] } = useQuery({
    queryKey: ['my-appraisal-interests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('appraisal_interests')
        .select('*')
        .eq('customer_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitInterest = useMutation({
    mutationFn: async () => {
      if (!user || !selectedAppraisal) throw new Error('Missing data');
      
      const { error } = await supabase
        .from('appraisal_interests')
        .insert({
          appraisal_id: selectedAppraisal.id,
          customer_id: user.id,
          offer_amount: offerAmount ? parseFloat(offerAmount) : null,
          message: message || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Your interest has been submitted! The agent will contact you soon.');
      setSelectedAppraisal(null);
      setOfferAmount('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['my-appraisal-interests'] });
    },
    onError: (error) => {
      toast.error('Failed to submit: ' + error.message);
    },
  });

  const handleSubmitInterest = () => {
    if (!user) {
      sessionStorage.setItem('redirectAfterAuth', '/pre-market');
      navigate('/auth');
      return;
    }
    submitInterest.mutate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasSubmittedInterest = (appraisalId: string) => {
    return myInterests.some((interest: any) => interest.appraisal_id === appraisalId);
  };

  const getInterestStatus = (appraisalId: string) => {
    const interest = myInterests.find((i: any) => i.appraisal_id === appraisalId);
    return interest?.status || null;
  };

  const getPropertyTypeLabel = (type: string | null) => {
    if (!type) return 'Property';
    const labels: Record<string, string> = {
      house: 'House',
      unit: 'Unit',
      townhouse: 'Townhouse',
      land: 'Land',
      rural: 'Rural',
    };
    return labels[type] || type;
  };

  const confidenceColors: Record<string, string> = {
    high: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const statusConfig: Record<string, { label: string; icon: any; variant: string }> = {
    pending: { label: 'Interest Submitted', icon: Clock, variant: 'secondary' },
    contacted: { label: 'Agent Contacted', icon: CheckCircle, variant: 'default' },
    accepted: { label: 'Offer Accepted', icon: CheckCircle, variant: 'success' },
    declined: { label: 'Not Proceeding', icon: AlertCircle, variant: 'destructive' },
  };

  return (
    <BuyerLayout>
      <div className="container px-4 py-6 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Pre-Market Properties
          </h1>
          <p className="text-muted-foreground font-body max-w-xl mx-auto">
            Get early access to properties before they hit the market. Express interest or make an offer to secure your dream home first.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && appraisals.length === 0 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No Pre-Market Properties</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                There are no pre-market properties available at the moment. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Appraisals Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {appraisals.map((appraisal) => {
            const hasInterest = hasSubmittedInterest(appraisal.id);
            const interestStatus = getInterestStatus(appraisal.id);
            const status = interestStatus ? statusConfig[interestStatus] : null;

            return (
              <Card 
                key={appraisal.id} 
                className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:border-accent/50 transition-all duration-300 group overflow-hidden"
              >
                {/* Property Image */}
                {appraisal.images && appraisal.images.length > 0 ? (
                  <div 
                    className="aspect-[16/10] relative cursor-pointer"
                    onClick={() => openLightbox(appraisal.images!, 0)}
                  >
                    <img
                      src={appraisal.images[0]}
                      alt={appraisal.headline || appraisal.address}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {appraisal.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {appraisal.images.length}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30 backdrop-blur-sm">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Pre-Market
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-muted/50 flex items-center justify-center relative">
                    <Home className="w-12 h-12 text-muted-foreground/50" />
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Pre-Market
                      </Badge>
                    </div>
                  </div>
                )}

                <CardContent className="pt-4">
                  {/* Property Type & Confidence */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {getPropertyTypeLabel(appraisal.property_type)}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${confidenceColors[appraisal.confidence] || confidenceColors.medium}`}
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
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {appraisal.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appraisal.suburb}, {appraisal.state} {appraisal.postcode}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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

                  {/* Price Range */}
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="font-display font-bold text-lg text-foreground">
                      {formatCurrency(appraisal.price_from)} - {formatCurrency(appraisal.price_to)}
                    </span>
                  </div>

                  {/* Notes preview */}
                  {appraisal.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 bg-muted/30 rounded-lg p-2">
                      {appraisal.notes}
                    </p>
                  )}

                  {/* Status or Action */}
                  {(() => {
                    const invitation = getInvitationForAppraisal(appraisal.id);
                    
                    if (invitation && invitation.status === 'confirmed') {
                      return (
                        <Badge variant="default" className="w-full justify-center py-2 bg-green-500/10 text-green-600 border-green-500/30">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Inspection Confirmed
                        </Badge>
                      );
                    }
                    
                    if (invitation && invitation.status === 'pending') {
                      return (
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => {
                            setSelectedInvitation(invitation);
                            setInvitationModalOpen(true);
                          }}
                        >
                          <CalendarDays className="w-4 h-4" />
                          Select Inspection Time
                        </Button>
                      );
                    }
                    
                    if (hasInterest && status) {
                      return (
                        <Badge variant={status.variant as any} className="w-full justify-center py-2">
                          <status.icon className="w-4 h-4 mr-2" />
                          {status.label}
                        </Badge>
                      );
                    }
                    
                    return (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedAppraisal(appraisal)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedAppraisal(appraisal)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Express Interest
                        </Button>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Disclaimer */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl mt-8">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-body">
              <strong className="text-primary">Disclaimer:</strong> Pre-market appraisals are indicative only and not a formal valuation. 
              Expressing interest does not guarantee the property will be available or sold at the indicated price range.
              Final sale terms are subject to negotiation between buyer and seller.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interest Dialog */}
      <Dialog open={!!selectedAppraisal} onOpenChange={() => setSelectedAppraisal(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="font-display">Express Interest</DialogTitle>
            <DialogDescription>
              Submit your interest for this pre-market property. The agent will contact you to discuss further.
            </DialogDescription>
          </DialogHeader>

          {selectedAppraisal && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Property Image */}
              {selectedAppraisal.images && selectedAppraisal.images.length > 0 && (
                <div 
                  className="aspect-video rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => openLightbox(selectedAppraisal.images!, 0)}
                >
                  <img
                    src={selectedAppraisal.images[0]}
                    alt={selectedAppraisal.headline || selectedAppraisal.address}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Property Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                {selectedAppraisal.headline && (
                  <h4 className="font-semibold text-foreground mb-2">{selectedAppraisal.headline}</h4>
                )}
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{selectedAppraisal.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppraisal.suburb}, {selectedAppraisal.state} {selectedAppraisal.postcode}
                    </p>
                  </div>
                </div>
                
                {/* Features */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  {selectedAppraisal.bedrooms && (
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" /> {selectedAppraisal.bedrooms} beds
                    </span>
                  )}
                  {selectedAppraisal.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="w-4 h-4" /> {selectedAppraisal.bathrooms} baths
                    </span>
                  )}
                  {selectedAppraisal.parking && (
                    <span className="flex items-center gap-1">
                      <Car className="w-4 h-4" /> {selectedAppraisal.parking} cars
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-accent" />
                  <span className="font-bold text-foreground">
                    {formatCurrency(selectedAppraisal.price_from)} - {formatCurrency(selectedAppraisal.price_to)}
                  </span>
                </div>
              </div>

              {/* Offer Amount */}
              <div>
                <Label htmlFor="offer">Your Offer (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="offer"
                    type="number"
                    placeholder="Enter your offer amount"
                    className="pl-9"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to just express general interest
                </p>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Message to Agent</Label>
                <Textarea
                  id="message"
                  placeholder="Tell the agent why you're interested, your situation, timeline, etc."
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setSelectedAppraisal(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitInterest}
              disabled={submitInterest.isPending}
            >
              {submitInterest.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Interest
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxInitialIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        alt="Property"
      />

      {/* Select Inspection Time Modal */}
      {selectedInvitation && user && (
        <SelectInspectionTimeModal
          open={invitationModalOpen}
          onOpenChange={setInvitationModalOpen}
          invitation={selectedInvitation}
          customerId={user.id}
        />
      )}
    </BuyerLayout>
  );
}
