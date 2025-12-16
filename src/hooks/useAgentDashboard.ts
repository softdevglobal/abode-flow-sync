import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, startOfDay, endOfDay } from 'date-fns';

// Demo agent ID for prototype mode (per project memories)
const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

async function fetchAgentId(): Promise<string> {
  const { data, error } = await supabase.from('agents').select('id').limit(1).single();
  if (error || !data) return DEMO_AGENT_ID;
  return data.id;
}

export function useAgentDashboard() {
  // Fetch agent ID (uses first agent in DB or demo fallback)
  const { data: agentId } = useQuery({
    queryKey: ['dashboard-agent-id'],
    queryFn: fetchAgentId,
  });
  // Fetch active properties count
  const { data: activeCount = 0, isLoading: activeLoading } = useQuery({
    queryKey: ['dashboard-active-properties', agentId],
    queryFn: async () => {
      if (!agentId) return 0;
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('status', 'active');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!agentId,
  });

  // Fetch pending properties count
  const { data: pendingCount = 0, isLoading: pendingLoading } = useQuery({
    queryKey: ['dashboard-pending-properties', agentId],
    queryFn: async () => {
      if (!agentId) return 0;
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('status', 'pending');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!agentId,
  });

  // Fetch sold properties count
  const { data: soldCount = 0, isLoading: soldLoading } = useQuery({
    queryKey: ['dashboard-sold-properties', agentId],
    queryFn: async () => {
      if (!agentId) return 0;
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('status', 'sold');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!agentId,
  });

  // Fetch total properties count
  const { data: totalCount = 0, isLoading: totalLoading } = useQuery({
    queryKey: ['dashboard-total-properties', agentId],
    queryFn: async () => {
      if (!agentId) return 0;
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!agentId,
  });

  // Fetch scheduled inspections for next 7 days
  const { data: upcomingInspectionsCount = 0, isLoading: inspectionsLoading } = useQuery({
    queryKey: ['dashboard-upcoming-inspections', agentId],
    queryFn: async () => {
      if (!agentId) return 0;
      
      const now = startOfDay(new Date());
      const nextWeek = endOfDay(addDays(now, 7));
      
      // Get property IDs for this agent first
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .eq('agent_id', agentId);
      
      if (propError) throw propError;
      if (!properties || properties.length === 0) return 0;
      
      const propertyIds = properties.map(p => p.id);
      
      const { count, error } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .eq('status', 'scheduled')
        .gte('date_time', now.toISOString())
        .lte('date_time', nextWeek.toISOString());
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!agentId,
  });

  // Fetch pending inspection bookings count
  const { data: pendingBookingsCount = 0, isLoading: bookingsLoading } = useQuery({
    queryKey: ['dashboard-pending-bookings', agentId],
    queryFn: async () => {
      if (!agentId) return 0;
      
      // Get property IDs for this agent
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .eq('agent_id', agentId);
      
      if (propError) throw propError;
      if (!properties || properties.length === 0) return 0;
      
      const propertyIds = properties.map(p => p.id);
      
      // Get inspection IDs for those properties
      const { data: inspections, error: inspError } = await supabase
        .from('inspections')
        .select('id')
        .in('property_id', propertyIds);
      
      if (inspError) throw inspError;
      if (!inspections || inspections.length === 0) return 0;
      
      const inspectionIds = inspections.map(i => i.id);
      
      const { count, error } = await supabase
        .from('inspection_bookings')
        .select('*', { count: 'exact', head: true })
        .in('inspection_id', inspectionIds)
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!agentId,
  });

  return {
    activeCount,
    pendingCount,
    soldCount,
    totalCount,
    upcomingInspectionsCount,
    pendingBookingsCount,
    isLoading: activeLoading || pendingLoading || soldLoading || totalLoading || inspectionsLoading || bookingsLoading,
  };
}

// Fetch recent notifications for agent (uses agent's user_id) with realtime updates
export function useAgentNotifications(limit: number = 5) {
  const queryClient = useQueryClient();
  
  // For prototype, we get the agent's user_id from the agents table
  const { data: agentData } = useQuery({
    queryKey: ['dashboard-agent-user'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agents').select('user_id').limit(1).single();
      if (error || !data) return null;
      return data;
    },
  });

  const userId = agentData?.user_id;

  // Set up realtime subscription for notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime notification update:', payload);
          // Invalidate and refetch notifications
          queryClient.invalidateQueries({ queryKey: ['agent-notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ['agent-notifications', userId, limit],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

// Mark a notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-notifications'] });
    },
  });
}
