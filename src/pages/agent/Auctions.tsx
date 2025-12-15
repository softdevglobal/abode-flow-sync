import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Plus, 
  Gavel, 
  Clock, 
  Building2,
  Loader2,
  Pencil,
  CalendarDays
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

function useUpcomingAuctions() {
  return useQuery({
    queryKey: ['agent-upcoming-auctions'],
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

      // Get auctions excluding sold and passed_in, ordered by start_time ascending
      const { data: auctions, error } = await supabase
        .from('auctions')
        .select('*')
        .in('property_id', propertyIds)
        .not('status', 'in', '("sold","passed_in")')
        .order('start_time', { ascending: true });

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

  // Filter out properties that already have active auctions
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
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDateTime = new Date(startDate);
      startDateTime.setHours(hours, minutes, 0, 0);

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
      queryClient.invalidateQueries({ queryKey: ['agent-upcoming-auctions'] });
      queryClient.invalidateQueries({ queryKey: ['existing-auctions'] });
      onOpenChange(false);

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
            Schedule New Auction
          </DialogTitle>
          <DialogDescription>
            Set up a live auction for one of your properties.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            Schedule Auction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuctionCard({ auction }: { auction: AuctionWithProperty }) {
  const navigate = useNavigate();
  const property = auction.property;
  const startTime = new Date(auction.start_time);

  const getStatusBadge = () => {
    switch (auction.status) {
      case 'live':
        return <Badge variant="success" className="animate-pulse">LIVE</Badge>;
      case 'pending':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'paused':
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Paused</Badge>;
      default:
        return <Badge variant="secondary">{auction.status}</Badge>;
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-lg",
      auction.status === 'live' && "ring-2 ring-green-500/50"
    )}>
      {/* Property Image */}
      <div className="aspect-video relative">
        {property?.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Building2 className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Address */}
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1">
            {property?.address || 'Unknown Property'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {property?.suburb}, {property?.state} {property?.postcode}
          </p>
        </div>

        {/* Auction Date/Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span>{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{format(startTime, 'h:mm a')}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1"
            size="lg"
            onClick={() => navigate(`/agent/auction/${auction.id}/run`)}
          >
            <Gavel className="w-4 h-4 mr-2" />
            Launch Console
          </Button>
          <Button 
            variant="outline"
            size="lg"
            onClick={() => {
              // Placeholder for edit functionality
              toast.info('Edit auction coming soon');
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onSchedule }: { onSchedule: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Gavel className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No upcoming auctions</h3>
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        You don't have any scheduled auctions. Create one to get started with live bidding.
      </p>
      <div className="flex gap-3">
        <Button onClick={onSchedule}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Auction
        </Button>
        <Button variant="outline" asChild>
          <Link to="/agent/properties">
            <Building2 className="w-4 h-4 mr-2" />
            View Properties
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function AgentAuctions() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: auctions, isLoading } = useUpcomingAuctions();

  return (
    <AgentLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auctions</h1>
            <p className="text-muted-foreground">
              Manage and run live auctions for your properties
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Auction
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !auctions || auctions.length === 0 ? (
          <EmptyState onSchedule={() => setCreateDialogOpen(true)} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>

      <CreateAuctionDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </AgentLayout>
  );
}
