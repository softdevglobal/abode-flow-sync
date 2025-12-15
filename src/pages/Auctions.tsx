import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileNav } from '@/components/layout/MobileNav';
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
  MapPin, ArrowRight, Loader2, LogIn, UserCheck
} from 'lucide-react';
import { format, isPast, differenceInSeconds } from 'date-fns';
import { toast } from 'sonner';

type AuctionStatus = 'all' | 'live' | 'pending';

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
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<AuctionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);

  const handleRegisterToBid = (auctionId: string, isLive: boolean) => {
    if (!user) {
      setSelectedAuctionId(auctionId);
      setShowRegisterDialog(true);
    } else {
      // User is authenticated, navigate to auction
      if (isLive) {
        toast.success('You are registered to bid!');
      }
      navigate(`/auction/live/${auctionId}`);
    }
  };

  const handleSignInClick = () => {
    // Store the intended auction destination
    if (selectedAuctionId) {
      sessionStorage.setItem('redirectAfterAuth', `/auction/live/${selectedAuctionId}`);
    }
    setShowRegisterDialog(false);
    navigate('/auth');
  };

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['public-auctions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('auctions')
        .select(`
          id,
          status,
          start_time,
          end_time,
          current_bid,
          min_increment,
          reserve_price,
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
        `)
        .in('status', ['live', 'pending'])
        .order('start_time', { ascending: true });

      if (statusFilter !== 'all') {
        query = supabase
          .from('auctions')
          .select(`
            id,
            status,
            start_time,
            end_time,
            current_bid,
            min_increment,
            reserve_price,
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
          `)
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

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Gavel className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Live Auctions</h1>
                <p className="text-sm text-muted-foreground">
                  Bid on properties in real-time
                </p>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">{liveCount}</span>
              <span className="text-muted-foreground">Live Now</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{upcomingCount}</span>
              <span className="text-muted-foreground">Upcoming</span>
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
              <TabsList>
                <TabsTrigger value="all">All ({auctions.length})</TabsTrigger>
                <TabsTrigger value="live">
                  Live ({liveCount})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Upcoming ({upcomingCount})
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
            <Gavel className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No auctions found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Check back soon for upcoming auctions'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
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
              const startTime = new Date(auction.start_time);
              const endTime = new Date(auction.end_time);
              const hasStarted = isPast(startTime);

              return (
                <Card key={auction.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
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
                    <h3 className="font-semibold text-lg line-clamp-1 mb-1">
                      {property.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                      <MapPin className="w-3 h-3" />
                      {property.suburb}, {property.state} {property.postcode}
                    </p>

                    {/* Bid Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {isLive ? 'Current Bid' : 'Starting Bid'}
                        </p>
                        <p className="text-xl font-bold text-primary flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {formatCurrency(auction.current_bid || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {isLive ? 'Ends' : 'Starts'}
                        </p>
                        <p className="text-sm font-medium">
                          {format(isLive ? endTime : startTime, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-2">
                      <Button 
                        className={`w-full ${isLive ? 'bg-red-500 hover:bg-red-600' : ''}`}
                        variant={isLive ? 'default' : 'outline'}
                        onClick={() => handleRegisterToBid(auction.id, isLive)}
                      >
                        {user ? (
                          <>
                            <Gavel className="w-4 h-4 mr-2" />
                            {isLive ? 'Join Live Auction' : 'View Auction'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Register to Bid
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Register to Bid Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-primary" />
              Register to Bid
            </DialogTitle>
            <DialogDescription>
              Sign in or create an account to participate in live auctions and place bids on properties.
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
              Sign In to Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNav userRole="customer" />
    </div>
  );
}
