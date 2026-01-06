import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useCurrentAgent } from '@/hooks/useCurrentAgent';

type Property = Tables<'properties'>;
type PropertyInsert = TablesInsert<'properties'>;
type PropertyUpdate = TablesUpdate<'properties'>;

// Fetch properties for agent
async function fetchProperties(agentId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
  return data || [];
}

export function useAgentProperties() {
  const queryClient = useQueryClient();
  const { agentId } = useCurrentAgent();

  // Query for properties
  const { data: properties = [], isLoading: loading } = useQuery({
    queryKey: ['agent-properties', agentId],
    queryFn: () => fetchProperties(agentId),
    enabled: !!agentId,
  });

  // Create property mutation
  const createMutation = useMutation({
    mutationFn: async (propertyData: Omit<PropertyInsert, 'agent_id'>) => {
      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...propertyData,
          agent_id: agentId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-properties'] });
      toast.success('Property created successfully');
    },
    onError: (error) => {
      console.error('Error creating property:', error);
      toast.error('Failed to create property');
    },
  });

  // Update property mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PropertyUpdate }) => {
      const { data: result, error } = await supabase
        .from('properties')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-properties'] });
      toast.success('Property updated successfully');
    },
    onError: (error) => {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
    },
  });

  // Delete property mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-properties'] });
      toast.success('Property deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    },
  });

  const createProperty = async (propertyData: Omit<PropertyInsert, 'agent_id'>) => {
    try {
      return await createMutation.mutateAsync(propertyData);
    } catch {
      return null;
    }
  };

  const updateProperty = async (id: string, propertyData: PropertyUpdate) => {
    try {
      return await updateMutation.mutateAsync({ id, data: propertyData });
    } catch {
      return null;
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    properties,
    loading,
    agentId,
    createProperty,
    updateProperty,
    deleteProperty,
  };
}
