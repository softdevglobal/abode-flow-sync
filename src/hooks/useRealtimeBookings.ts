import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type InspectionBooking = Tables<'inspection_bookings'>;

interface BookingWithProfile extends InspectionBooking {
  profiles: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
}

export function useRealtimeBookings(inspectionId: string | undefined) {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch initial bookings
  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['realtime-inspection-bookings', inspectionId],
    queryFn: async (): Promise<BookingWithProfile[]> => {
      if (!inspectionId) return [];

      // First get the bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('inspection_bookings')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      if (!bookingsData || bookingsData.length === 0) return [];

      // Get unique customer IDs
      const customerIds = [...new Set(bookingsData.map(b => b.customer_id))];

      // Fetch profiles for those customers
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone')
        .in('id', customerIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Combine bookings with profiles
      return bookingsData.map(booking => ({
        ...booking,
        profiles: profilesMap.get(booking.customer_id) || null,
      })) as BookingWithProfile[];
    },
    enabled: !!inspectionId,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!inspectionId) return;

    const channel = supabase
      .channel(`inspection-bookings-${inspectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspection_bookings',
          filter: `inspection_id=eq.${inspectionId}`,
        },
        (payload) => {
          console.log('Realtime booking update:', payload);
          // Refetch to get updated data with profile info
          refetch();
          // Also invalidate related queries
          queryClient.invalidateQueries({ 
            queryKey: ['inspection-bookings', inspectionId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['agent-inspections'] 
          });
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [inspectionId, queryClient, refetch]);

  // Get counts
  const totalCount = bookings?.length || 0;
  const checkedInCount = bookings?.filter(b => b.checked_in_at)?.length || 0;
  const pendingCount = bookings?.filter(b => b.status === 'pending')?.length || 0;
  const confirmedCount = bookings?.filter(b => b.status === 'confirmed')?.length || 0;

  return {
    bookings: bookings || [],
    isLoading,
    isSubscribed,
    totalCount,
    checkedInCount,
    pendingCount,
    confirmedCount,
    refetch,
  };
}
