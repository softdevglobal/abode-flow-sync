import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuction, useRealtimeBids, useAuctionControls } from '@/hooks/useRealtimeAuction';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Gavel, TrendingUp, Users, Clock, CheckCircle2, LogIn, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';

export default function LiveAuction() {
  const { id: auctionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: auction, isLoading: auctionLoading, refetch: refetchAuction } = useAuction(auctionId);
  const { bids, highestBid, bidCount, isSubscribed, latestBidId } = useRealtimeBids(auctionId);
  const { placeBid } = useAuctionControls(auctionId);

  const bidderId = user?.id || null;

  const [bidAmount, setBidAmount] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastBidWasMine, setLastBidWasMine] = useState(false);

  const currentBid = auction?.current_bid || 0;
  const minIncrement = auction?.min_increment || 1000;
  const minBid = currentBid + minIncrement;
  const maxBid = currentBid + (minIncrement * 50);

  const isHighestBidder = bidderId ? highestBid?.bidder_id === bidderId : false;
  const isSold = auction?.status === 'sold';
  const isPassedIn = auction?.status === 'passed_in';
  const isLive = auction?.status === 'live';
  const isPaused = auction?.status === 'paused';

  // Initialize bid amount when auction loads
  useEffect(() => {
    if (auction && bidAmount === 0) {
      setBidAmount(minBid);
    }
  }, [auction, minBid, bidAmount]);

  // Subscribe to auction status changes
  useEffect(() => {
    if (!auctionId) return;

    const channel = supabase
      .channel(`auction-status-${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          console.log('Auction status changed:', payload);
          refetchAuction();
          
          if (payload.new.status === 'sold') {
            toast.success('Auction ended - Property SOLD!');
          } else if (payload.new.status === 'passed_in') {
            toast.info('Auction ended - Property passed in');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId, refetchAuction]);

  // Trigger confetti when our bid becomes highest
  useEffect(() => {
    if (!bidderId) return;
    if (latestBidId && highestBid?.id === latestBidId && highestBid?.bidder_id === bidderId) {
      setLastBidWasMine(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else if (latestBidId && highestBid?.bidder_id !== bidderId) {
      setLastBidWasMine(false);
    }
  }, [latestBidId, highestBid, bidderId]);

  // Update min bid when current bid changes
  useEffect(() => {
    if (currentBid > 0) {
      setBidAmount(currentBid + minIncrement);
    }
  }, [currentBid, minIncrement]);

  const handlePlaceBid = useCallback(async () => {
    if (!bidderId) {
      toast.error('Please sign in to place a bid');
      return;
    }
    if (!auctionId || bidAmount < minBid) {
      toast.error(`Minimum bid is $${minBid.toLocaleString()}`);
      return;
    }

    try {
      await placeBid.mutateAsync({ amount: bidAmount, bidderId });
      toast.success(`Bid of $${bidAmount.toLocaleString()} placed!`);
    } catch (error) {
      console.error('Failed to place bid:', error);
      toast.error('Failed to place bid');
    }
  }, [auctionId, bidAmount, minBid, placeBid, bidderId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (auctionLoading || authLoading) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading auction...</div>
        </div>
      </BuyerLayout>
    );
  }

  if (!auction) {
    return (
      <BuyerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Auction not found</p>
          <Button variant="outline" onClick={() => navigate('/browse')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Button>
        </div>
      </BuyerLayout>
    );
  }

  const property = auction.property as {
    id: string;
    title: string;
    address: string;
    suburb: string;
    state: string;
    postcode: string;
    images: string[] | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parking: number | null;
  } | null;

  return (
    <BuyerLayout>
      <div className="relative overflow-hidden">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)],
                  width: '10px',
                  height: '10px',
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                }}
              />
            ))}
          </div>
        )}

        {/* Status Bar */}
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {/* Bidder Registration Status */}
              {user ? (
                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Registered to Bid
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                  <UserX className="w-3 h-3 mr-1" />
                  Not Registered
                </Badge>
              )}
              {isSubscribed && (
                <Badge variant="outline" className="text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  Live
                </Badge>
              )}
              {isLive && (
                <Badge className="bg-red-500 text-white animate-pulse">
                  <Gavel className="w-3 h-3 mr-1" />
                  LIVE AUCTION
                </Badge>
              )}
              {isPaused && (
                <Badge variant="secondary">PAUSED</Badge>
              )}
              {isSold && (
                <Badge className="bg-green-600 text-white">SOLD</Badge>
              )}
              {isPassedIn && (
                <Badge variant="secondary">PASSED IN</Badge>
              )}
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Property Card */}
          <Card className="mb-6 overflow-hidden">
            <div className="relative h-48 md:h-64 bg-muted">
              {property?.images?.[0] ? (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h1 className="text-xl md:text-2xl font-bold">{property?.title || 'Property'}</h1>
                <p className="text-sm opacity-90">
                  {property?.address}, {property?.suburb} {property?.state} {property?.postcode}
                </p>
              </div>
            </div>
          </Card>

          {/* Current Bid Hero */}
          <Card className={`mb-6 ${isHighestBidder && !isSold ? 'ring-2 ring-green-500' : ''}`}>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">Current High Bid</p>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-4 animate-fade-in">
                {formatCurrency(currentBid)}
              </div>
              {isHighestBidder && !isSold && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  You are the highest bidder!
                </Badge>
              )}
              {lastBidWasMine && !isHighestBidder && !isSold && (
                <Badge variant="destructive">
                  You've been outbid!
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="py-4 text-center">
                <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{bidCount}</p>
                <p className="text-xs text-muted-foreground">Total Bids</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <TrendingUp className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{formatCurrency(minIncrement)}</p>
                <p className="text-xs text-muted-foreground">Min Increment</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-medium">
                  {auction.end_time ? format(new Date(auction.end_time), 'h:mm a') : '-'}
                </p>
                <p className="text-xs text-muted-foreground">End Time</p>
              </CardContent>
            </Card>
          </div>

          {/* Bid Controls or Sold Message */}
          {isSold ? (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                  Property Sold!
                </h2>
                <p className="text-green-600 dark:text-green-500">
                  Final price: {formatCurrency(currentBid)}
                </p>
                {isHighestBidder && (
                  <Badge className="mt-4 bg-green-600 text-white">
                    Congratulations! You won the auction!
                  </Badge>
                )}
              </CardContent>
            </Card>
          ) : isPassedIn ? (
            <Card className="bg-muted">
              <CardContent className="py-8 text-center">
                <Gavel className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">Auction Passed In</h2>
                <p className="text-muted-foreground">
                  The property did not meet reserve. Contact the agent for post-auction negotiations.
                </p>
              </CardContent>
            </Card>
          ) : !user ? (
            /* Sign in prompt for unauthenticated users */
            <Card>
              <CardContent className="py-8 text-center">
                <LogIn className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sign in to Place Bids</h3>
                <p className="text-muted-foreground mb-6">
                  Create an account or sign in to participate in this live auction.
                </p>
                <Button asChild size="lg">
                  <Link to="/auth">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In to Bid
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <h3 className="font-semibold mb-4 text-center">Place Your Bid</h3>
                
                {/* Slider */}
                <div className="mb-6">
                  <Slider
                    value={[bidAmount]}
                    onValueChange={(values) => setBidAmount(values[0])}
                    min={minBid}
                    max={maxBid}
                    step={minIncrement}
                    disabled={!isLive || isHighestBidder}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(minBid)}</span>
                    <span>{formatCurrency(maxBid)}</span>
                  </div>
                </div>

                {/* Manual Input */}
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      className="pl-7 text-lg font-semibold"
                      min={minBid}
                      step={minIncrement}
                      disabled={!isLive || isHighestBidder}
                    />
                  </div>
                </div>

                {/* Quick Bid Buttons */}
                <div className="flex gap-2 mb-6">
                  {[1, 2, 5, 10].map((multiplier) => (
                    <Button
                      key={multiplier}
                      variant="outline"
                      size="sm"
                      onClick={() => setBidAmount(currentBid + (minIncrement * multiplier))}
                      disabled={!isLive || isHighestBidder}
                      className="flex-1"
                    >
                      +{formatCurrency(minIncrement * multiplier)}
                    </Button>
                  ))}
                </div>

                <Separator className="mb-6" />

                {/* Place Bid Button */}
                <Button
                  size="lg"
                  className="w-full text-lg py-6"
                  onClick={handlePlaceBid}
                  disabled={!isLive || isHighestBidder || bidAmount < minBid || placeBid.isPending}
                >
                  {placeBid.isPending ? (
                    'Placing Bid...'
                  ) : isHighestBidder ? (
                    'You are the highest bidder'
                  ) : isPaused ? (
                    'Auction Paused'
                  ) : !isLive ? (
                    'Auction Not Live'
                  ) : (
                    <>
                      <Gavel className="w-5 h-5 mr-2" />
                      Place Bid: {formatCurrency(bidAmount)}
                    </>
                  )}
                </Button>

                {bidAmount < minBid && isLive && (
                  <p className="text-destructive text-sm text-center mt-2">
                    Minimum bid is {formatCurrency(minBid)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Bids */}
          <Card className="mt-6">
            <CardContent className="py-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recent Bids
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {bids.slice(0, 10).map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`flex justify-between items-center p-2 rounded ${
                      index === 0 ? 'bg-primary/10' : 'bg-muted/50'
                    } ${bidderId && bid.bidder_id === bidderId ? 'ring-1 ring-primary' : ''}`}
                  >
                    <span className="text-sm">
                      {bidderId && bid.bidder_id === bidderId ? 'You' : `Bidder ${bid.bidder_id.slice(-4)}`}
                    </span>
                    <span className="font-semibold">{formatCurrency(bid.amount)}</span>
                  </div>
                ))}
                {bids.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No bids yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </BuyerLayout>
  );
}