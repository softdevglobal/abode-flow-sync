import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Bid = Tables<'bids'>;
type Auction = Tables<'auctions'>;

export interface BidWithBidder extends Bid {
  bidder?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

export function useRealtimeBids(auctionId: string | undefined) {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [latestBidId, setLatestBidId] = useState<string | null>(null);

  // Fetch bids
  const { data: bids, isLoading, refetch } = useQuery({
    queryKey: ['auction-bids', auctionId],
    queryFn: async (): Promise<BidWithBidder[]> => {
      if (!auctionId) return [];

      const { data: bidsData, error } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!bidsData || bidsData.length === 0) return [];

      // Get bidder profiles
      const bidderIds = [...new Set(bidsData.map(b => b.bidder_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', bidderIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return bidsData.map(bid => ({
        ...bid,
        bidder: profilesMap.get(bid.bidder_id) || null,
      }));
    },
    enabled: !!auctionId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!auctionId) return;

    const channel = supabase
      .channel(`auction-bids-${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          console.log('New bid received:', payload);
          setLatestBidId(payload.new.id);
          refetch();
          // Also update auction current_bid
          queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
        console.log('Bids realtime subscription:', status);
      });

    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [auctionId, queryClient, refetch]);

  // Get highest bid
  const highestBid = bids?.[0] || null;
  const bidCount = bids?.length || 0;

  return {
    bids: bids || [],
    highestBid,
    bidCount,
    isLoading,
    isSubscribed,
    latestBidId,
    refetch,
  };
}

export function useAuction(auctionId: string | undefined) {
  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: async () => {
      if (!auctionId) return null;

      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          property:property_id (
            id,
            title,
            address,
            suburb,
            state,
            postcode,
            images,
            bedrooms,
            bathrooms,
            parking
          )
        `)
        .eq('id', auctionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!auctionId,
  });
}

export function useAuctionControls(auctionId: string | undefined) {
  const queryClient = useQueryClient();

  const updateAuctionStatus = useMutation({
    mutationFn: async ({ status, currentBid }: { status: 'pending' | 'live' | 'paused' | 'sold' | 'passed_in'; currentBid?: number }) => {
      if (!auctionId) throw new Error('No auction ID');

      const updateData: { status: 'pending' | 'live' | 'paused' | 'sold' | 'passed_in'; current_bid?: number } = { status };
      if (currentBid !== undefined) {
        updateData.current_bid = currentBid;
      }

      const { data, error } = await supabase
        .from('auctions')
        .update(updateData)
        .eq('id', auctionId)
        .select();

      if (error) {
        console.error('Failed to update auction status:', error);
        throw error;
      }
      
      console.log('Auction status updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-auctions'] });
    },
  });

  const updatePropertyStatus = useMutation({
    mutationFn: async ({ propertyId, status }: { propertyId: string; status: 'active' | 'pending' | 'sold' | 'off_market' }) => {
      const { data, error } = await supabase
        .from('properties')
        .update({ status })
        .eq('id', propertyId)
        .select();

      if (error) {
        console.error('Failed to update property status:', error);
        throw error;
      }
      
      console.log('Property status updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-properties'] });
    },
  });

  const placeBid = useMutation({
    mutationFn: async ({ amount, bidderId }: { amount: number; bidderId: string }) => {
      if (!auctionId) throw new Error('No auction ID');

      const { error } = await supabase
        .from('bids')
        .insert({
          auction_id: auctionId,
          bidder_id: bidderId,
          amount,
        });

      if (error) throw error;

      // Update auction current bid
      await supabase
        .from('auctions')
        .update({ current_bid: amount })
        .eq('id', auctionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-bids', auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
    },
  });

  return {
    updateAuctionStatus,
    updatePropertyStatus,
    placeBid,
  };
}
