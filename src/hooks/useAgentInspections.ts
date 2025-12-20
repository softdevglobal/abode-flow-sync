import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Inspection = Tables<'inspections'>;
type Property = Tables<'properties'>;

// Demo agent ID for prototype
const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

export interface InspectionWithProperty extends Inspection {
  property: Property | null;
  checked_in_count?: number;
}

export function useAgentInspections() {
  const queryClient = useQueryClient();

  const inspectionsQuery = useQuery({
    queryKey: ['agent-inspections'],
    queryFn: async (): Promise<InspectionWithProperty[]> => {
      const agentId = DEMO_AGENT_ID;

      // Get properties for this agent
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('agent_id', agentId);

      if (!properties || properties.length === 0) return [];

      const propertyIds = properties.map(p => p.id);

      // Get inspections for these properties
      const { data: inspections, error } = await supabase
        .from('inspections')
        .select('*')
        .in('property_id', propertyIds)
        .order('date_time', { ascending: true });

      if (error) throw error;

      // Get full property details
      const { data: fullProperties } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds);

      const propertiesMap = new Map(fullProperties?.map(p => [p.id, p]) || []);

      // Get checked-in counts for all inspections
      const inspectionIds = (inspections || []).map(i => i.id);
      const { data: bookings } = await supabase
        .from('inspection_bookings')
        .select('inspection_id')
        .in('inspection_id', inspectionIds)
        .not('checked_in_at', 'is', null);

      // Count checked-in per inspection
      const checkedInCounts = new Map<string, number>();
      bookings?.forEach(b => {
        checkedInCounts.set(b.inspection_id, (checkedInCounts.get(b.inspection_id) || 0) + 1);
      });

      return (inspections || []).map(inspection => ({
        ...inspection,
        property: propertiesMap.get(inspection.property_id) || null,
        checked_in_count: checkedInCounts.get(inspection.id) || 0,
      }));
    },
  });

  // Real-time subscription to inspection_bookings for live attendee updates
  useEffect(() => {
    const channel = supabase
      .channel('inspection-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspection_bookings',
        },
        () => {
          // Refetch inspections to get updated counts
          queryClient.invalidateQueries({ queryKey: ['agent-inspections'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createInspection = useMutation({
    mutationFn: async (data: Omit<TablesInsert<'inspections'>, 'id' | 'created_at'>) => {
      const { data: inspection, error } = await supabase
        .from('inspections')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return inspection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-inspections'] });
      toast.success('Inspection scheduled successfully');
    },
    onError: (error) => {
      toast.error('Failed to schedule inspection');
      console.error(error);
    },
  });

  const updateInspection = useMutation({
    mutationFn: async ({ id, ...data }: TablesUpdate<'inspections'> & { id: string }) => {
      const { data: inspection, error } = await supabase
        .from('inspections')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return inspection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-inspections'] });
      toast.success('Inspection updated');
    },
    onError: (error) => {
      toast.error('Failed to update inspection');
      console.error(error);
    },
  });

  const cancelInspection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inspections')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-inspections'] });
      toast.success('Inspection cancelled');
    },
    onError: (error) => {
      toast.error('Failed to cancel inspection');
      console.error(error);
    },
  });

  return {
    inspections: inspectionsQuery.data || [],
    isLoading: inspectionsQuery.isLoading,
    error: inspectionsQuery.error,
    createInspection,
    updateInspection,
    cancelInspection,
  };
}
