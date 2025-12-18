import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  Home
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Appraisal {
  id: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  price_from: number;
  price_to: number;
  confidence: string;
  notes: string | null;
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
                {/* Pre-market badge */}
                <div className="bg-accent/10 px-4 py-2 border-b border-border/50">
                  <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Pre-Market
                  </Badge>
                </div>

                <CardContent className="pt-4">
                  {/* Address */}
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-display font-semibold text-foreground">
                        {appraisal.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appraisal.suburb}, {appraisal.state} {appraisal.postcode}
                      </p>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="font-display font-bold text-lg text-foreground">
                      {formatCurrency(appraisal.price_from)} - {formatCurrency(appraisal.price_to)}
                    </span>
                  </div>

                  {/* Confidence Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge 
                      variant="outline" 
                      className={confidenceColors[appraisal.confidence] || confidenceColors.medium}
                    >
                      {appraisal.confidence.charAt(0).toUpperCase() + appraisal.confidence.slice(1)} Confidence
                    </Badge>
                  </div>

                  {/* Notes preview */}
                  {appraisal.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {appraisal.notes}
                    </p>
                  )}

                  {/* Status or Action */}
                  {hasInterest && status ? (
                    <Badge variant={status.variant as any} className="w-full justify-center py-2">
                      <status.icon className="w-4 h-4 mr-2" />
                      {status.label}
                    </Badge>
                  ) : (
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
                  )}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Express Interest</DialogTitle>
            <DialogDescription>
              Submit your interest for this pre-market property. The agent will contact you to discuss further.
            </DialogDescription>
          </DialogHeader>

          {selectedAppraisal && (
            <div className="space-y-4">
              {/* Property Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">{selectedAppraisal.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppraisal.suburb}, {selectedAppraisal.state} {selectedAppraisal.postcode}
                    </p>
                  </div>
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

          <DialogFooter>
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
    </BuyerLayout>
  );
}
