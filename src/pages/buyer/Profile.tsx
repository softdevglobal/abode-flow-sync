import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { 
  User, Gavel, TrendingUp, Clock, ArrowLeft, LogIn,
  History, Award, MapPin, Loader2, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

export default function BuyerProfile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('bids');

  // Fetch user's bid history
  const { data: bidHistory = [], isLoading: bidsLoading } = useQuery({
    queryKey: ['user-bid-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('bids')
        .select(`
          id,
          amount,
          created_at,
          auction_id,
          auction:auctions(
            id,
            status,
            current_bid,
            start_time,
            end_time,
            property:properties(
              id,
              title,
              address,
              suburb,
              state,
              images
            )
          )
        `)
        .eq('bidder_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch auctions the user has participated in
  const { data: participatedAuctions = [], isLoading: auctionsLoading } = useQuery({
    queryKey: ['user-auctions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get unique auction IDs where user has placed bids
      const { data: userBids, error: bidsError } = await supabase
        .from('bids')
        .select('auction_id')
        .eq('bidder_id', user.id);

      if (bidsError) throw bidsError;
      if (!userBids || userBids.length === 0) return [];

      const auctionIds = [...new Set(userBids.map(b => b.auction_id))];

      const { data, error } = await supabase
        .from('auctions')
        .select(`
          id,
          status,
          current_bid,
          start_time,
          end_time,
          property:properties(
            id,
            title,
            address,
            suburb,
            state,
            images
          )
        `)
        .in('id', auctionIds)
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Check if user is highest bidder on each auction
      const auctionsWithStatus = await Promise.all(
        (data || []).map(async (auction) => {
          const { data: highestBid } = await supabase
            .from('bids')
            .select('bidder_id')
            .eq('auction_id', auction.id)
            .order('amount', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...auction,
            isHighestBidder: highestBid?.bidder_id === user.id,
            userBidCount: userBids.filter(b => b.auction_id === auction.id).length,
          };
        })
      );

      return auctionsWithStatus;
    },
    enabled: !!user?.id,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 text-white">Live</Badge>;
      case 'pending':
        return <Badge variant="secondary">Upcoming</Badge>;
      case 'sold':
        return <Badge className="bg-green-600 text-white">Sold</Badge>;
      case 'passed_in':
        return <Badge variant="secondary">Passed In</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <BuyerLayout>
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-display font-bold mb-2">Sign in to view your profile</h2>
              <p className="text-muted-foreground mb-6 font-body">
                Access your bid history, auction participation, and account settings.
              </p>
              <Button asChild size="lg" className="shadow-glow-sm">
                <Link to="/auth">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </BuyerLayout>
    );
  }

  const totalBids = bidHistory.length;
  const activeAuctions = participatedAuctions.filter(a => a.status === 'live' || a.status === 'pending').length;
  const wonAuctions = participatedAuctions.filter(a => a.status === 'sold' && a.isHighestBidder).length;

  return (
    <BuyerLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-display font-bold">My Profile</h1>
            <p className="text-sm text-muted-foreground font-body">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()} className="border-border/50">
            Sign Out
          </Button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
            <CardContent className="py-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
                <History className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-display font-bold">{totalBids}</p>
              <p className="text-xs text-muted-foreground font-body">Total Bids</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
            <CardContent className="py-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
                <Gavel className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-display font-bold">{activeAuctions}</p>
              <p className="text-xs text-muted-foreground font-body">Active Auctions</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
            <CardContent className="py-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-1">
                <Award className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-display font-bold">{wonAuctions}</p>
              <p className="text-xs text-muted-foreground font-body">Auctions Won</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="bids" className="flex-1">
              <History className="w-4 h-4 mr-2" />
              Bid History
            </TabsTrigger>
            <TabsTrigger value="auctions" className="flex-1">
              <Gavel className="w-4 h-4 mr-2" />
              My Auctions
            </TabsTrigger>
          </TabsList>

          {/* Bid History Tab */}
          <TabsContent value="bids">
            {bidsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : bidHistory.length === 0 ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <History className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-bold mb-2">No bids yet</h3>
                  <p className="text-muted-foreground mb-6 font-body">
                    Start bidding on properties to build your history.
                  </p>
                  <Button asChild className="shadow-glow-sm">
                    <Link to="/auctions">
                      <Gavel className="w-4 h-4 mr-2" />
                      Browse Auctions
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {bidHistory.map((bid) => {
                  const auction = bid.auction as any;
                  const property = auction?.property as any;

                  return (
                    <Card key={bid.id} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Property Image */}
                          <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {property?.images?.[0] ? (
                              <img
                                src={property.images[0]}
                                alt={property.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No Image
                              </div>
                            )}
                          </div>

                          {/* Bid Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-sm line-clamp-1">
                                  {property?.title || 'Property'}
                                </h4>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {property?.suburb}, {property?.state}
                                </p>
                              </div>
                              {getStatusBadge(auction?.status)}
                            </div>

                            <Separator className="my-2" />

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Your Bid</p>
                                <p className="font-bold text-primary">{formatCurrency(bid.amount)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(bid.created_at), 'MMM d, h:mm a')}
                                </p>
                                {auction?.status === 'live' && (
                                  <Link 
                                    to={`/auction/live/${auction.id}`}
                                    className="text-xs text-primary hover:underline flex items-center justify-end gap-1"
                                  >
                                    View Live <ExternalLink className="w-3 h-3" />
                                  </Link>
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

          {/* My Auctions Tab */}
          <TabsContent value="auctions">
            {auctionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : participatedAuctions.length === 0 ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Gavel className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-bold mb-2">No auctions yet</h3>
                  <p className="text-muted-foreground mb-6 font-body">
                    Participate in auctions to see them here.
                  </p>
                  <Button asChild className="shadow-glow-sm">
                    <Link to="/auctions">
                      <Gavel className="w-4 h-4 mr-2" />
                      Browse Auctions
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {participatedAuctions.map((auction) => {
                  const property = auction.property as any;

                  return (
                    <Card key={auction.id} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:border-primary/30 transition-colors">
                      <div className="flex">
                        {/* Property Image */}
                        <div className="w-32 h-32 bg-muted flex-shrink-0">
                          {property?.images?.[0] ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No Image
                            </div>
                          )}
                        </div>

                        <CardContent className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-semibold line-clamp-1">
                                {property?.title || 'Property'}
                              </h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {property?.suburb}, {property?.state}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {getStatusBadge(auction.status)}
                              {auction.isHighestBidder && auction.status !== 'passed_in' && (
                                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950">
                                  <Award className="w-3 h-3 mr-1" />
                                  {auction.status === 'sold' ? 'Won' : 'Leading'}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {auction.status === 'sold' || auction.status === 'passed_in' ? 'Final Price' : 'Current Bid'}
                              </p>
                              <p className="font-bold text-lg flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                {formatCurrency(auction.current_bid || 0)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Your Bids</p>
                              <p className="font-medium">{auction.userBidCount}</p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <Button 
                              asChild 
                              size="sm" 
                              variant={auction.status === 'live' ? 'default' : 'outline'}
                              className={auction.status === 'live' ? 'bg-red-500 hover:bg-red-600' : ''}
                            >
                              <Link to={`/auction/live/${auction.id}`}>
                                {auction.status === 'live' ? 'Join Live' : 'View Details'}
                                <ExternalLink className="w-3 h-3 ml-2" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </BuyerLayout>
  );
}
