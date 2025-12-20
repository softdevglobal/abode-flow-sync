import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Gavel, 
  ArrowLeft, 
  Wifi, 
  WifiOff, 
  TrendingUp, 
  Clock, 
  Users, 
  Bell,
  Volume2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  UserCheck
} from 'lucide-react';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useRealtimeBids, useAuction, useAuctionControls } from '@/hooks/useRealtimeAuction';
import { useAuctionRegistrations } from '@/hooks/useAuctionRegistration';
import { cn } from '@/lib/utils';

export default function AuctionConsole() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manualBidAmount, setManualBidAmount] = useState('');
  const [callCount, setCallCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevHighestBidRef = useRef<number>(0);

  const { data: auction, isLoading: auctionLoading } = useAuction(id);
  const { bids, highestBid, bidCount, isSubscribed, latestBidId } = useRealtimeBids(id);
  const { updateAuctionStatus, updatePropertyStatus, placeBid } = useAuctionControls(id);
  const { data: registrations = [], isLoading: registrationsLoading } = useAuctionRegistrations(id);

  const currentHighBid = highestBid?.amount || auction?.current_bid || 0;
  const minIncrement = auction?.min_increment || 1000;
  const minNextBid = currentHighBid + minIncrement;
  const property = auction?.property as any;

  // Animate when new bid comes in
  useEffect(() => {
    if (currentHighBid > prevHighestBidRef.current && prevHighestBidRef.current > 0) {
      setIsAnimating(true);
      setCallCount(0); // Reset call count on new bid
      
      // Play notification sound (optional - browser audio)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVpCZJKPiIiJfVpUXGmBmZKLhHlcSlpkeY6YkYh9cGFZX2l4goeLiYV+dnNxcnh/g4eLioqIhYOBgYOFh4mKioqJiIeGhYWGh4iJiYmJiIeHhoaGh4eIiImJiIiHh4eHh4eHiIiIiIiIiIeHh4eHh4iIiIiIiIiIh4eHh4eHiIiIiIg=');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if blocked
      } catch {}

      toast.success('New bid received!', {
        description: `$${currentHighBid.toLocaleString()}`,
      });

      setTimeout(() => setIsAnimating(false), 1000);
    }
    prevHighestBidRef.current = currentHighBid;
  }, [currentHighBid]);

  const handleCallOnce = () => {
    setCallCount(1);
    toast.info('Going once...', {
      description: `Current bid: $${currentHighBid.toLocaleString()}`,
      duration: 3000,
    });
  };

  const handleCallTwice = () => {
    setCallCount(2);
    toast.info('Going twice...', {
      description: `Current bid: $${currentHighBid.toLocaleString()}`,
      duration: 3000,
    });
  };

  const handleSold = async () => {
    if (!auction || !property) return;

    try {
      // Update auction status to sold
      await updateAuctionStatus.mutateAsync({ 
        status: 'sold', 
        currentBid: currentHighBid 
      });

      // Update property status to sold
      await updatePropertyStatus.mutateAsync({ 
        propertyId: property.id, 
        status: 'sold' 
      });

      toast.success('SOLD!', {
        description: `Property sold for $${currentHighBid.toLocaleString()}`,
      });

      // Navigate back after a moment
      setTimeout(() => navigate('/agent/properties'), 2000);
    } catch (error) {
      toast.error('Failed to finalize sale');
      console.error(error);
    }
  };

  const handlePassIn = async () => {
    if (!auction) return;

    try {
      await updateAuctionStatus.mutateAsync({ status: 'passed_in' });
      toast.info('Auction passed in');
      setTimeout(() => navigate('/agent/properties'), 2000);
    } catch (error) {
      toast.error('Failed to update auction');
    }
  };

  const handleManualBid = async () => {
    const amount = parseFloat(manualBidAmount);
    if (isNaN(amount) || amount < minNextBid) {
      toast.error(`Bid must be at least $${minNextBid.toLocaleString()}`);
      return;
    }
    
    try {
      // Use a placeholder bidder ID for manual/in-room bids (agent's demo ID)
      const manualBidderId = 'da39b948-790b-4a66-94b4-394445a98062';
      await placeBid.mutateAsync({ amount, bidderId: manualBidderId });
      toast.success(`Manual bid of $${amount.toLocaleString()} recorded`);
      setManualBidAmount('');
    } catch (error) {
      console.error('Failed to place bid:', error);
      toast.error('Failed to record bid');
    }
  };

  if (auctionLoading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AgentLayout>
    );
  }

  if (!auction) {
    return (
      <AgentLayout>
        <div className="container px-4 py-6">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Auction Not Found</h2>
            <p className="text-muted-foreground mb-4">This auction doesn't exist or you don't have access.</p>
            <Button onClick={() => navigate('/agent/properties')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Button>
          </div>
        </div>
      </AgentLayout>
    );
  }

  const isSold = auction.status === 'sold';
  const isPassedIn = auction.status === 'passed_in';
  const isEnded = isSold || isPassedIn;

  return (
    <AgentLayout>
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                <Gavel className="w-6 h-6 text-primary" />
                Auction Console
              </h1>
              <p className="text-sm text-muted-foreground font-body">
                {property?.address}, {property?.suburb}
              </p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Badge variant="success" className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                Connecting...
              </Badge>
            )}
            <Badge variant={isEnded ? 'secondary' : 'default'} className="uppercase">
              {auction.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Current Bid & Property */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current High Bid - Hero Display */}
            <Card className={cn(
              "border-2 transition-all duration-300 rounded-2xl",
              isAnimating ? "border-success bg-success/5 scale-[1.02]" : "border-primary/50 bg-card/50 backdrop-blur-sm",
              isEnded && "opacity-75"
            )}>
              <CardContent className="pt-8 pb-10 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-body">
                  Current High Bid
                </p>
                <p className={cn(
                  "font-display text-5xl md:text-7xl font-bold transition-all duration-300",
                  isAnimating ? "text-success scale-110" : "text-primary",
                  isSold && "text-success"
                )}>
                  ${currentHighBid.toLocaleString()}
                </p>
                <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {bidCount} bids
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Min increment: ${minIncrement.toLocaleString()}
                  </span>
                </div>

                {/* Call count indicator */}
                {callCount > 0 && !isEnded && (
                  <div className="mt-6">
                    <Badge variant="warning" className="text-lg px-4 py-2">
                      {callCount === 1 ? 'Going Once...' : 'Going Twice...'}
                    </Badge>
                  </div>
                )}

                {isSold && (
                  <div className="mt-6">
                    <Badge variant="success" className="text-lg px-6 py-3">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      SOLD
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Card */}
            {property && (
              <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {property.images?.[0] && (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-display font-semibold">{property.title}</h3>
                      <p className="text-sm text-muted-foreground font-body">
                        {property.address}, {property.suburb} {property.state} {property.postcode}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground font-body">
                        <span>{property.bedrooms} bed</span>
                        <span>{property.bathrooms} bath</span>
                        <span>{property.parking} car</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bid History */}
            <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between font-display">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Bid History
                  </span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">{bidCount} bids</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bids.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gavel className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No bids yet</p>
                    <p className="text-xs mt-1">Bids will appear here in real-time</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {bids.map((bid, index) => (
                      <div
                        key={bid.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all",
                          index === 0 ? "bg-primary/10 border border-primary/30" : "bg-muted/50",
                          bid.id === latestBidId && "animate-pulse"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                            index === 0 ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">
                              ${Number(bid.amount).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {bid.bidder?.first_name} {bid.bidder?.last_name?.[0]}.
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(bid.created_at), 'h:mm:ss a')}
                          </p>
                          {index === 0 && (
                            <Badge variant="success" className="text-xs mt-1">
                              Highest
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registered Bidders */}
            <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between font-display">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Registered Bidders
                  </span>
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
                    {registrations.length} registered
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {registrationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No registered bidders yet</p>
                    <p className="text-xs mt-1">Buyers will appear here when they register</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[250px]">
                    <div className="space-y-2">
                      {registrations.map((registration) => {
                        const profile = registration.profile as { id: string; first_name: string | null; last_name: string | null; email: string } | null;
                        const initials = profile 
                          ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'U'
                          : 'U';
                        const displayName = profile 
                          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
                          : 'Unknown User';
                        
                        // Check if this bidder has placed any bids
                        const hasBid = bids.some(bid => bid.bidder_id === registration.user_id);
                        const isHighestBidder = highestBid?.bidder_id === registration.user_id;
                        
                        return (
                          <div
                            key={registration.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg",
                              isHighestBidder ? "bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800" : "bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className={cn(
                                  "text-sm font-medium",
                                  isHighestBidder ? "bg-green-500 text-white" : "bg-primary/10 text-primary"
                                )}>
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{displayName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {profile?.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isHighestBidder ? (
                                <Badge variant="success" className="text-xs">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Leading
                                </Badge>
                              ) : hasBid ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Gavel className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Registered
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-6">
            {/* Manual Bid Entry */}
            {!isEnded && (
              <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-display">Manual Bid Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Bid Amount</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder={`Min: $${minNextBid.toLocaleString()}`}
                        value={manualBidAmount}
                        onChange={(e) => setManualBidAmount(e.target.value)}
                      />
                      <Button onClick={handleManualBid}>
                        Accept
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Next bid must be at least ${minNextBid.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Auctioneer Calls */}
            {!isEnded && (
              <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 font-display">
                    <Volume2 className="w-4 h-4 text-primary" />
                    Auctioneer Calls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant={callCount >= 1 ? "secondary" : "outline"}
                    className="w-full"
                    onClick={handleCallOnce}
                    disabled={callCount >= 1}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Going Once
                    {callCount >= 1 && <CheckCircle className="w-4 h-4 ml-2 text-success" />}
                  </Button>
                  <Button
                    variant={callCount >= 2 ? "secondary" : "outline"}
                    className="w-full"
                    onClick={handleCallTwice}
                    disabled={callCount < 1 || callCount >= 2}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Going Twice
                    {callCount >= 2 && <CheckCircle className="w-4 h-4 ml-2 text-success" />}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Final Actions */}
            {!isEnded && (
              <Card className="border-destructive/50 rounded-2xl bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base text-destructive font-display">Final Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full h-16 text-xl font-bold bg-success hover:bg-success/90"
                        disabled={callCount < 2 || bidCount === 0}
                      >
                        <Gavel className="w-6 h-6 mr-2" />
                        SOLD
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-background border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">Confirm Sale</AlertDialogTitle>
                        <AlertDialogDescription className="font-body">
                          Mark this property as sold for ${currentHighBid.toLocaleString()}?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleSold}
                          className="bg-success hover:bg-success/90"
                        >
                          Confirm Sale
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-warning text-warning hover:bg-warning/10"
                      >
                        Pass In
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Pass In Auction</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will end the auction without a sale. The property will remain active.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handlePassIn}
                          className="bg-warning hover:bg-warning/90"
                        >
                          Pass In
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}

            {/* Ended state */}
            {isEnded && (
              <Card className={cn(
                "border-2",
                isSold ? "border-success bg-success/5" : "border-warning bg-warning/5"
              )}>
                <CardContent className="pt-6 text-center">
                  {isSold ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                      <h3 className="font-bold text-lg text-success">Auction Complete</h3>
                      <p className="text-muted-foreground">
                        Sold for ${currentHighBid.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-3" />
                      <h3 className="font-bold text-lg text-warning">Passed In</h3>
                      <p className="text-muted-foreground">
                        Reserve not met
                      </p>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/agent/properties')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Properties
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}
