import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export type MessageCategory = 'newsletter' | 'auction' | 'pre_market' | 'inspection' | 'message';

export interface BuyerMessage {
  id: string;
  buyer_id: string;
  agent_id: string | null;
  category: MessageCategory;
  subject: string;
  content: string;
  property_id: string | null;
  appraisal_id: string | null;
  auction_id: string | null;
  read: boolean;
  starred: boolean;
  created_at: string;
  updated_at: string;
  agent?: {
    id: string;
    agency_name: string | null;
    profile_image: string | null;
  } | null;
}

export interface MessageCounts {
  all: number;
  newsletter: number;
  auction: number;
  pre_market: number;
  inspection: number;
  message: number;
}

export function useBuyerMessages(categoryFilter?: MessageCategory | 'all', unreadOnly: boolean = false) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages with optional filtering
  const { data: messages = [], isLoading, error, refetch } = useQuery({
    queryKey: ['buyer-messages', user?.id, categoryFilter, unreadOnly],
    queryFn: async (): Promise<BuyerMessage[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('buyer_messages')
        .select(`
          *,
          agent:agents (
            id,
            agency_name,
            profile_image
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as BuyerMessage[];
    },
    enabled: !!user?.id,
  });

  // Fetch unread counts by category
  const { data: unreadCounts } = useQuery({
    queryKey: ['buyer-messages-counts', user?.id],
    queryFn: async (): Promise<MessageCounts> => {
      if (!user?.id) return { all: 0, newsletter: 0, auction: 0, pre_market: 0, inspection: 0, message: 0 };

      const { data, error } = await supabase
        .from('buyer_messages')
        .select('category')
        .eq('buyer_id', user.id)
        .eq('read', false);

      if (error) throw error;

      const counts: MessageCounts = {
        all: data?.length || 0,
        newsletter: 0,
        auction: 0,
        pre_market: 0,
        inspection: 0,
        message: 0,
      };

      data?.forEach(msg => {
        const cat = msg.category as MessageCategory;
        if (cat in counts) {
          counts[cat]++;
        }
      });

      return counts;
    },
    enabled: !!user?.id,
  });

  // Mark single message as read
  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('buyer_messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-messages'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-messages-counts'] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async (category?: MessageCategory) => {
      if (!user?.id) return;

      let query = supabase
        .from('buyer_messages')
        .update({ read: true })
        .eq('buyer_id', user.id)
        .eq('read', false);

      if (category) {
        query = query.eq('category', category);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-messages'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-messages-counts'] });
    },
  });

  // Toggle starred
  const toggleStarred = useMutation({
    mutationFn: async ({ messageId, starred }: { messageId: string; starred: boolean }) => {
      const { error } = await supabase
        .from('buyer_messages')
        .update({ starred })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-messages'] });
    },
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`buyer-messages-realtime:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buyer_messages',
          filter: `buyer_id=eq.${user.id}`,
        },
        (payload) => {
          console.debug('[realtime] buyer_messages change', payload);
          queryClient.invalidateQueries({ queryKey: ['buyer-messages'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['buyer-messages-counts'], exact: false });
        }
      )
      .subscribe((status) => {
        console.debug('[realtime] buyer messages subscription status', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    messages,
    isLoading,
    error,
    unreadCounts: unreadCounts || { all: 0, newsletter: 0, auction: 0, pre_market: 0, inspection: 0, message: 0 },
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    toggleStarred: toggleStarred.mutate,
    refetch,
  };
}
