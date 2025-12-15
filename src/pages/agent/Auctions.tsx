import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { 
  Plus, 
  Gavel, 
  Play, 
  Pause, 
  Clock, 
  TrendingUp,
  Building2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAgentProperties } from '@/hooks/useAgentProperties';
import { cn } from '@/lib/utils';

// Demo agent ID for prototype
const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

type StatusFilter = 'all' | 'pending' | 'live' | 'sold' | 'passed_in';

interface AuctionWithProperty {
  id: string;
  property_id: string;
  start_time: string;
  end_time: string;
  min_increment: number;
  reserve_price: number | null;
  current_bid: number;
  status: string;
  created_at: string;
  property: {
    id: string;
    title: string;
    address: string;
    suburb: string;
    state: string;
    postcode: string;
    images: string[] | null;
  } | null;
}

function useAgentAuctions() {
  return useQuery({
    queryKey: ['agent-auctions'],
    queryFn: async (): Promise<AuctionWithProperty[]> => {
      // Get agent's properties first
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .limit(1)
        .maybeSingle();

      const agentId = agentData?.id || DEMO_AGENT_ID;

      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('agent_id', agentId);

      if (!properties || properties.length === 0) return [];

      const propertyIds = properties.map(p => p.id);

      // Get auctions for these properties
      const { data: auctions, error } = await supabase
        .from('auctions')
        .select('*')
        .in('property_id', propertyIds)
        .order('start_time', { ascending: false });

      if (error) throw error;
      if (!auctions || auctions.length === 0) return [];

      // Get property details
      const { data: fullProperties } = await supabase
        .from('properties')
        .select('id, title, address, suburb, state, postcode, images')
        .in('id', propertyIds);

      const propertiesMap = new Map(fullProperties?.map(p => [p.id, p]) || []);

      return auctions.map(auction => ({
        ...auction,
        property: propertiesMap.get(auction.property_id) || null,
      }));
    },
  });
}

function CreateAuctionDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { properties } = useAgentProperties();
  const [selectedProperty, setSelectedProperty] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [startTime, setStartTime] = useState('10:00');
  const [minIncrement, setMinIncrement] = useState('1000');
  const [reservePrice, setReservePrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Filter out properties that already have auctions
  const { data: existingAuctions } = useQuery({
    queryKey: ['existing-auctions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('auctions')
        .select('property_id')
        .not('status', 'in', '("sold","passed_in")');
      return data?.map(a => a.property_id) || [];
    },
  });

  const availableProperties = properties.filter(
    p => !existingAuctions?.includes(p.id) && p.status === 'active'
  );

  const handleCreate = async () => {
    if (!selectedProperty || !startDate) {
      toast.error('Please select a property and date');
      return;
    }

    setIsCreating(true);

    try {
      // Combine date and time
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDateTime = new Date(startDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      // End time is 1 hour after start by default
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);

      const { error } = await supabase.from('auctions').insert({
        property_id: selectedProperty,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        min_increment: parseFloat(minIncrement) || 1000,
        reserve_price: reservePrice ? parseFloat(reservePrice) : null,
        status: 'pending',
        current_bid: 0,
      });

      if (error) throw error;

      toast.success('Auction created successfully');
      queryClient.invalidateQueries({ queryKey: ['agent-auctions'] });
      queryClient.invalidateQueries({ queryKey: ['existing-auctions'] });
      onOpenChange(false);

      // Reset form
      setSelectedProperty('');
      setStartDate(undefined);
      setStartTime('10:00');
      setMinIncrement('1000');
      setReservePrice('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create auction');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5" />
            Create New Auction
          </DialogTitle>
          <DialogDescription>
            Set up a live auction for one of your properties.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label>Property</Label>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {availableProperties.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No eligible properties
                  </div>
                ) : (
                  availableProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{property.address}, {property.suburb}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Auction Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Increment ($)</Label>
              <Input
                type="number"
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label>Reserve Price ($)</Label>
              <Input
                type="number"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={isCreating || !selectedProperty || !startDate}>
            {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Auction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuctionCard({ auction }: { auction: AuctionWithProperty }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const property = auction.property;
  const startTime = new Date(auction.start_time);
  const isLive = auction.status === 'live';
  const isPending = auction.status === 'pending';
  const isSold = auction.status === 'sold';
  const isPassedIn = auction.status === 'passed_in';
  const isPaused = auction.status === 'paused';

  const startAuction = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('auctions')
        .update({ status: 'live' })
        .eq('id', auction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-auctions'] });
      toast.success('Auction is now LIVE!');
    },
    onError: () => toast.error('Failed to start auction'),
  });

  const pauseAuction = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('auctions')
        .update({ status: 'paused' })
        .eq('id', auction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-auctions'] });
      toast.info('Auction paused');
    },
    onError: () => toast.error('Failed to pause auction'),
  });

  const resumeAuction = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('auctions')
        .update({ status: 'live' })
        .eq('id', auction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-auctions'] });
      toast.success('Auction resumed');
    },
    onError: () => toast.error('Failed to resume auction'),
  });

  const getStatusBadge = () => {
    switch (auction.status) {
      case 'live':
        return <Badge variant="success" className="animate-pulse">LIVE</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'paused':
        return <Badge variant="warning">Paused</Badge>;
      case 'sold':
        return <Badge variant="default" className="bg-success">Sold</Badge>;
      case 'passed_in':
        return <Badge variant="outline">Passed In</Badge>;
      default:
        return <Badge variant="secondary">{auction.status}</Badge>;
    }
  };

  return (
    <Card className={cn(
      "transition-all",
      isLive && "border-success/50 bg-success/5",
      (isSold || isPassedIn) && "opacity-75"
    )}>
      <CardContent className="p-0">
        <div className="flex gap-4">
          {/* Property Image */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0">
            {property?.images?.[0] ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover rounded-l-lg"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-l-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 py-4 pr-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground line-clamp-1">
                  {property?.address || 'Unknown Property'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {property?.suburb}, {property?.state}
                </p>
              </div>
              {getStatusBadge()}
            </div>

            {/* Auction Details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(startTime, 'MMM d, yyyy h:mm a')}
              </span>
              {auction.current_bid > 0 && (
                <span className="flex items-center gap-1 text-primary font-medium">
                  <TrendingUp className="w-4 h-4" />
                  ${Number(auction.current_bid).toLocaleString()}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {isPending && (
                <Button 
                  size="sm" 
                  onClick={() => startAuction.mutate()}
                  disabled={startAuction.isPending}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start Live
                </Button>
              )}

              {isLive && (
                <>
                  <Button 
                    size="sm"
                    onClick={() => navigate(`/agent/auction/${auction.id}/run`)}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open Console
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => pauseAuction.mutate()}
                    disabled={pauseAuction.isPending}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                </>
              )}

              {isPaused && (
                <>
                  <Button 
                    size="sm"
                    onClick={() => resumeAuction.mutate()}
                    disabled={resumeAuction.isPending}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/agent/auction/${auction.id}/run`)}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Console
                  </Button>
                </>
              )}

              {isSold && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Sold for ${Number(auction.current_bid).toLocaleString()}
                  </span>
                </div>
              )}

              {isPassedIn && (
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Passed In</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgentAuctions() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: auctions, isLoading } = useAgentAuctions();

  const filteredAuctions = auctions?.filter(a => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  }) || [];

  // Stats
  const liveCount = auctions?.filter(a => a.status === 'live').length || 0;
  const pendingCount = auctions?.filter(a => a.status === 'pending').length || 0;
  const soldCount = auctions?.filter(a => a.status === 'sold').length || 0;

  return (
    <AgentLayout>
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Gavel className="w-6 h-6" />
              Auctions
            </h1>
            <p className="text-muted-foreground text-sm">
              {liveCount} live • {pendingCount} pending • {soldCount} sold
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Auction
          </Button>
        </div>

        {/* Filters */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="mb-6">
          <TabsList className="grid grid-cols-5 w-full sm:w-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="live" className="text-xs sm:text-sm">Live</TabsTrigger>
            <TabsTrigger value="sold" className="text-xs sm:text-sm">Sold</TabsTrigger>
            <TabsTrigger value="passed_in" className="text-xs sm:text-sm">Passed In</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {statusFilter === 'all' 
                ? 'No auctions yet' 
                : `No ${statusFilter.replace('_', ' ')} auctions`}
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Auction
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <CreateAuctionDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen} 
        />
      </div>
    </AgentLayout>
  );
}
