import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Gavel, TrendingUp, Clock, Search, Bed, Bath, Car, 
  MapPin, ArrowRight, Loader2, LogIn, UserCheck, CheckCircle, XCircle, UserPlus
} from 'lucide-react';
import { format, isPast, differenceInSeconds } from 'date-fns';
import { toast } from 'sonner';

type AuctionStatus = 'all' | 'live' | 'pending' | 'completed';

// Countdown Timer Component
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  function calculateTimeLeft(target: Date) {
    const totalSeconds = differenceInSeconds(target, new Date());
    if (totalSeconds <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return { days, hours, minutes, seconds, expired: false };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) {
    return <span className="text-xs text-primary font-medium">Starting soon...</span>;
  }

  if (timeLeft.days > 0) {
    return (
      <div className="flex items-center gap-1 text-xs font-mono">
        <span className="bg-muted px-1.5 py-0.5 rounded">{timeLeft.days}d</span>
        <span className="bg-muted px-1.5 py-0.5 rounded">{timeLeft.hours}h</span>
        <span className="bg-muted px-1.5 py-0.5 rounded">{timeLeft.minutes}m</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <span className="bg-muted px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
      <span className="bg-muted px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
    </div>
  );
}

export default function Auctions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<AuctionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showRegisterConfirmDialog, setShowRegisterConfirmDialog] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);

  // Fetch user's registrations
  const { data: userRegistrations = [] } = useQuery({
    queryKey: ['user-auction-registrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('auction_registrations')
        .select('auction_id, status')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isRegisteredForAuction = (auctionId: string) => {
    return userRegistrations.some(
      (reg) => reg.auction_id === auctionId && reg.status === 'approved'
    );
  };

  // Register for auction mutation
  const registerMutation = useMutation({
    mutationFn: async (auctionId: string) => {
      if (!user?.id) throw new Error('Must be logged in');
      const { data, error } = await supabase
        .from('auction_registrations')
        .insert({ auction_id: auctionId, user_id: user.id, status: 'approved' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-auction-registrations'] });
      toast.success('Successfully registered for auction!');
      setShowRegisterConfirmDialog(false);
      if (selectedAuctionId) {
        navigate(`/auction/live/${selectedAuctionId}`);
      }
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.info('You are already registered for this auction');
        if (selectedAuctionId) navigate(`/auction/live/${selectedAuctionId}`);
      } else {
        toast.error('Failed to register for auction');
      }
    },
  });

  const handleRegisterToBid = (auctionId: string, isLive: boolean) => {
    setSelectedAuctionId(auctionId);
    
    if (!user) {
      setShowRegisterDialog(true);
      return;
    }
    
    // Check if already registered
    if (isRegisteredForAuction(auctionId)) {
      navigate(`/auction/live/${auctionId}`);
      return;
    }
    
    // Show registration confirmation dialog
    setShowRegisterConfirmDialog(true);
  };

  const handleConfirmRegistration = () => {
    if (selectedAuctionId) {
      registerMutation.mutate(selectedAuctionId);
    }
  };

  const handleSignInClick = () => {
    if (selectedAuctionId) {
      sessionStorage.setItem('redirectAfterAuth', `/auctions`);
    }
    setShowRegisterDialog(false);
    navigate('/auth');
  };

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['public-auctions', statusFilter],
    queryFn: async () => {
      // Note: reserve_price is intentionally excluded for public security
      const selectQuery = `
        id,
        status,
        start_time,
        end_time,
        current_bid,
        min_increment,
        property:properties(
          id,
          title,
          address,
          suburb,
          state,
          postcode,
          images,
          bedrooms,
          bathrooms,
          parking,
          price_display
        )
      `;

      let query;
      
      if (statusFilter === 'all') {
        query = supabase
          .from('auctions')
          .select(selectQuery)
          .in('status', ['live', 'pending', 'sold', 'passed_in'])
          .order('start_time', { ascending: false });
      } else if (statusFilter === 'completed') {
        query = supabase
          .from('auctions')
          .select(selectQuery)
          .in('status', ['sold', 'passed_in'])
          .order('end_time', { ascending: false });
      } else {
        query = supabase
          .from('auctions')
          .select(selectQuery)
          .eq('status', statusFilter)
          .order('start_time', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredAuctions = auctions.filter((auction) => {
    if (!searchQuery) return true;
    const property = auction.property as any;
    if (!property) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      property.title?.toLowerCase().includes(searchLower) ||
      property.suburb?.toLowerCase().includes(searchLower) ||
      property.address?.toLowerCase().includes(searchLower)
    );
  });

  const liveCount = auctions.filter((a) => a.status === 'live').length;
  const upcomingCount = auctions.filter((a) => a.status === 'pending').length;
  const completedCount = auctions.filter((a) => a.status === 'sold' || a.status === 'passed_in').length;

  return (
    <BuyerLayout>
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-md border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-glow-sm">
                <Gavel className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Live Auctions</h1>
                <p className="text-sm text-muted-foreground font-body">
                  Bid on properties in real-time
                </p>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm" className="border-border/50">
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-border/50">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">{liveCount}</span>
              <span className="text-muted-foreground">Live Now</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-border/50">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">{upcomingCount}</span>
              <span className="text-muted-foreground">Upcoming</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-border/50">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="font-medium">{completedCount}</span>
              <span className="text-muted-foreground">Completed</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by location or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as AuctionStatus)}>
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="live">
                  Live ({liveCount})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Upcoming ({upcomingCount})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Gavel className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">No auctions found</h2>
            <p className="text-muted-foreground mb-6 font-body">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Check back soon for upcoming auctions'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')} className="border-border/50">
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAuctions.map((auction) => {
              const property = auction.property as any;
              if (!property) return null;

              const isLive = auction.status === 'live';
              const isSold = auction.status === 'sold';
              const isPassedIn = auction.status === 'passed_in';
              const isCompleted = isSold || isPassedIn;
              const startTime = new Date(auction.start_time);
              const endTime = new Date(auction.end_time);
              const hasStarted = isPast(startTime);

                return (
                <Card key={auction.id} className="overflow-hidden group hover:shadow-lg transition-all border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:border-primary/30">
                  {/* Image */}
                  <div className="relative h-48 bg-muted">
                    {property.images?.[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {isLive ? (
                        <Badge className="bg-red-500 text-white animate-pulse">
                          <span className="w-2 h-2 bg-white rounded-full mr-1.5" />
                          LIVE NOW
                        </Badge>
                      ) : isSold ? (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          SOLD
                        </Badge>
                      ) : isPassedIn ? (
                        <Badge variant="secondary" className="bg-gray-500 text-white">
                          <XCircle className="w-3 h-3 mr-1" />
                          PASSED IN
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Starts in
                        </Badge>
                      )}
                    </div>

                    {/* Countdown for pending auctions */}
                    {!isLive && !hasStarted && (
                      <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm rounded-md px-2 py-1.5 shadow-lg">
                        <CountdownTimer targetDate={startTime} />
                      </div>
                    )}

                    {/* Property Quick Stats */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-white text-sm">
                      <span className="flex items-center gap-1">
                        <Bed className="w-4 h-4" /> {property.bedrooms || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-4 h-4" /> {property.bathrooms || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" /> {property.parking || 0}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Property Info */}
                    <h3 className="font-display font-semibold text-lg line-clamp-1 mb-1 text-foreground">
                      {property.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4 font-body">
                      <MapPin className="w-3 h-3 text-primary" />
                      {property.suburb}, {property.state} {property.postcode}
                    </p>

                    {/* Bid Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-body">
                          {isCompleted ? 'Final Price' : isLive ? 'Current Bid' : 'Starting Bid'}
                        </p>
                        <p className={`text-xl font-display font-bold flex items-center gap-1 ${isCompleted ? 'text-muted-foreground' : 'text-primary'}`}>
                          <TrendingUp className="w-4 h-4" />
                          {formatCurrency(auction.current_bid || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-body">
                          {isCompleted ? 'Ended' : isLive ? 'Ends' : 'Starts'}
                        </p>
                        <p className="text-sm font-medium font-body">
                          {format(isCompleted ? endTime : isLive ? endTime : startTime, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-2">
                      {isCompleted ? (
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(`/auction/live/${auction.id}`)}
                        >
                          {isSold ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              View Sale Result
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              View Auction Details
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          className={`w-full ${isLive ? 'bg-red-500 hover:bg-red-600' : ''}`}
                          variant={isLive ? 'default' : 'outline'}
                          onClick={() => handleRegisterToBid(auction.id, isLive)}
                        >
                          {!user ? (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Register to Bid
                            </>
                          ) : isRegisteredForAuction(auction.id) ? (
                            <>
                              <Gavel className="w-4 h-4 mr-2" />
                              {isLive ? 'Join Live Auction' : 'View Auction'}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Register to Bid
                            </>
                          )}
                        </Button>
                      )}
                      {user && isRegisteredForAuction(auction.id) && !isCompleted && (
                        <Badge variant="outline" className="w-full justify-center text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Registered
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Sign In Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-primary" />
              Sign In Required
            </DialogTitle>
            <DialogDescription>
              Sign in or create an account to register for auctions and place bids on properties.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg mb-4">
              <UserCheck className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Why register?</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Place bids in real-time auctions</li>
                  <li>• Track your bid history</li>
                  <li>• Receive notifications on auction updates</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignInClick} className="gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Confirmation Dialog */}
      <Dialog open={showRegisterConfirmDialog} onOpenChange={setShowRegisterConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Register to Bid
            </DialogTitle>
            <DialogDescription>
              Confirm your registration to participate in this auction. Once registered, you'll be able to place bids.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">By registering, you agree to:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Honor any winning bid you place</li>
                  <li>• Provide valid contact information</li>
                  <li>• Follow auction terms and conditions</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowRegisterConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRegistration} 
              disabled={registerMutation.isPending}
              className="gap-2"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Confirm Registration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </BuyerLayout>
  );
}
