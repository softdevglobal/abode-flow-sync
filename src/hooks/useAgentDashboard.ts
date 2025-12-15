import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { addDays, startOfDay, endOfDay } from 'date-fns';

export function useAgentDashboard() {
  const { agentId } = useAuth();

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

// Fetch recent notifications for agent
export function useAgentNotifications(limit: number = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-notifications', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}
