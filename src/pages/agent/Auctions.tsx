import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow } from 'date-fns';
import { 
  Plus, 
  Gavel, 
  Clock, 
  Building2,
  Loader2,
  Trash2,
  CalendarDays,
  Radio
} from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  status: 'pending' | 'live' | 'paused' | 'sold' | 'passed_in';
  created_at: string;
  properties: {
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
      const agentId = DEMO_AGENT_ID;

      // Fetch auctions with property join, filtered by agent, sorted by start_time ascending
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          properties!inner (
            id,
            title,
            address,
            suburb,
            state,
            postcode,
            images
          )
        `)
        .eq('properties.agent_id', agentId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return (data as AuctionWithProperty[]) || [];
    },
  });
}

function useDeleteAuction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (auctionId: string) => {
      const { error } = await supabase
        .from('auctions')
        .delete()
        .eq('id', auctionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-auctions'] });
      queryClient.invalidateQueries({ queryKey: ['existing-auctions'] });
      toast.success('Auction cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel auction');
    },
  });
}

function formatAuctionTime(dateString: string): string {
  const date = new Date(dateString);
  const timeStr = format(date, 'h:mm a');
  
  if (isToday(date)) {
    return `Today at ${timeStr}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${timeStr}`;
  }
  return format(date, 'MMM d') + ` at ${timeStr}`;
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
      queryClient.invalidateQueries({ queryKey: ['agent-auctions'] });
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
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Gavel className="w-5 h-5 text-primary" />
            Schedule New Auction
          </DialogTitle>
          <DialogDescription className="font-body">
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
                    <CalendarDays className="mr-2 h-4 w-4" />
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

function AuctionCard({ 
  auction, 
  onDelete 
}: { 
  auction: AuctionWithProperty;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const property = auction.properties;
  const isLive = auction.status === 'live';
  const isPending = auction.status === 'pending';
  const isCompleted = auction.status === 'sold' || auction.status === 'passed_in';

  const getStatusBadge = () => {
    switch (auction.status) {
      case 'live':
        return (
          <Badge className="bg-red-500 text-white gap-1.5 animate-pulse">
            <Radio className="w-3 h-3" />
            LIVE NOW
          </Badge>
        );
      case 'pending':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'paused':
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Paused</Badge>;
      case 'sold':
        return <Badge className="bg-green-600 text-white">Sold</Badge>;
      case 'passed_in':
        return <Badge variant="outline">Passed In</Badge>;
      default:
        return <Badge variant="secondary">{auction.status}</Badge>;
    }
  };

  return (
    <>
      <Card className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl",
        isLive && "ring-2 ring-red-500 shadow-lg shadow-red-500/20",
        isCompleted && "opacity-75"
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
          {isLive && (
            <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent pointer-events-none" />
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Address */}
          <div>
            <h3 className="font-display font-semibold text-foreground line-clamp-1">
              {property?.address || 'Unknown Property'}
            </h3>
            <p className="text-sm text-muted-foreground font-body">
              {property?.suburb}, {property?.state} {property?.postcode}
            </p>
          </div>

          {/* Auction Time */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={cn(
              isLive && "text-red-600 font-medium"
            )}>
              {formatAuctionTime(auction.start_time)}
            </span>
          </div>

          {/* Final Price for completed */}
          {isCompleted && auction.current_bid > 0 && (
            <div className="text-sm font-medium">
              <span className={auction.status === 'sold' ? 'text-green-600' : 'text-muted-foreground'}>
                Final: ${Number(auction.current_bid).toLocaleString()}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              className={cn(
                "flex-1",
                isLive && "bg-red-600 hover:bg-red-700"
              )}
              onClick={() => navigate(`/agent/auction/${auction.id}/run`)}
            >
              <Gavel className="w-4 h-4 mr-2" />
              {isCompleted ? 'View Details' : 'Enter Console'}
            </Button>
            
            {isPending && (
              <Button 
                variant="outline"
                size="icon"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Cancel Auction</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Are you sure you want to cancel this auction for {property?.address}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Auction</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(auction.id)}
            >
              Cancel Auction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyState({ onSchedule }: { onSchedule: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Gavel className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-display text-xl font-semibold mb-2">No auctions yet</h3>
      <p className="text-muted-foreground text-center mb-6 max-w-sm font-body">
        Schedule your first auction to get started with live bidding.
      </p>
      <div className="flex gap-3">
        <Button onClick={onSchedule} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Auction
        </Button>
        <Button variant="outline" asChild className="rounded-xl">
          <Link to="/agent/properties">
            <Building2 className="w-4 h-4 mr-2" />
            View Properties
          </Link>
        </Button>
      </div>
    </div>
  );
}

function AuctionSection({ 
  title, 
  auctions,
  onDelete,
  icon: Icon,
  accentColor
}: { 
  title: string; 
  auctions: AuctionWithProperty[];
  onDelete: (id: string) => void;
  icon: React.ElementType;
  accentColor?: string;
}) {
  if (auctions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-5 h-5", accentColor || "text-primary")} />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <Badge variant="secondary" className="bg-primary/10 text-primary">{auctions.length}</Badge>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {auctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export default function AgentAuctions() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: auctions, isLoading } = useAgentAuctions();
  const deleteAuction = useDeleteAuction();

  // Separate auctions by status
  const liveAuctions = auctions?.filter(a => a.status === 'live') || [];
  const upcomingAuctions = auctions?.filter(a => a.status === 'pending' || a.status === 'paused') || [];
  const completedAuctions = auctions?.filter(a => a.status === 'sold' || a.status === 'passed_in') || [];

  const hasAuctions = auctions && auctions.length > 0;

  return (
    <AgentLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Auctions</h1>
            <p className="text-muted-foreground font-body">Manage your live property auctions</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Auction
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !hasAuctions ? (
          <EmptyState onSchedule={() => setCreateDialogOpen(true)} />
        ) : (
          <div className="space-y-10">
            <AuctionSection
              title="Live Auctions"
              auctions={liveAuctions}
              onDelete={(id) => deleteAuction.mutate(id)}
              icon={Radio}
              accentColor="text-red-500"
            />
            <AuctionSection
              title="Upcoming Auctions"
              auctions={upcomingAuctions}
              onDelete={(id) => deleteAuction.mutate(id)}
              icon={CalendarDays}
            />
            <AuctionSection
              title="Completed Auctions"
              auctions={completedAuctions}
              onDelete={(id) => deleteAuction.mutate(id)}
              icon={Gavel}
              accentColor="text-muted-foreground"
            />
          </div>
        )}

        <CreateAuctionDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    </AgentLayout>
  );
}
