import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useAuctionRegistration(auctionId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: registration, isLoading } = useQuery({
    queryKey: ['auction-registration', auctionId, user?.id],
    queryFn: async () => {
      if (!auctionId || !user?.id) return null;

      const { data, error } = await supabase
        .from('auction_registrations')
        .select('*')
        .eq('auction_id', auctionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!auctionId && !!user?.id,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!auctionId || !user?.id) {
        throw new Error('Must be logged in to register');
      }

      const { data, error } = await supabase
        .from('auction_registrations')
        .insert({
          auction_id: auctionId,
          user_id: user.id,
          status: 'approved',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-registration', auctionId, user?.id] });
      toast.success('Successfully registered for this auction!');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.info('You are already registered for this auction');
      } else {
        toast.error('Failed to register for auction');
        console.error('Registration error:', error);
      }
    },
  });

  const isRegistered = !!registration && registration.status === 'approved';

  return {
    registration,
    isRegistered,
    isLoading,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
  };
}

export function useAuctionRegistrations(auctionId: string | undefined) {
  return useQuery({
    queryKey: ['auction-registrations', auctionId],
    queryFn: async () => {
      if (!auctionId) return [];

      const { data, error } = await supabase
        .from('auction_registrations')
        .select(`
          *,
          profile:profiles(id, first_name, last_name, email)
        `)
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!auctionId,
  });
}
