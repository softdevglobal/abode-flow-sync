import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Property = Tables<'properties'>;
type PropertyInsert = TablesInsert<'properties'>;
type PropertyUpdate = TablesUpdate<'properties'>;

export function useAgentProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Fetch agent ID for the current user
  useEffect(() => {
    async function fetchAgentId() {
      if (!user) return;

      const { data, error } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching agent:', error);
        return;
      }

      if (data) {
        setAgentId(data.id);
      }
    }

    fetchAgentId();
  }, [user]);

  // Fetch properties for the agent
  useEffect(() => {
    async function fetchProperties() {
      if (!agentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        toast.error('Failed to load properties');
      } else {
        setProperties(data || []);
      }
      setLoading(false);
    }

    if (agentId) {
      fetchProperties();
    }
  }, [agentId]);

  const createProperty = async (propertyData: Omit<PropertyInsert, 'agent_id'>) => {
    if (!agentId) {
      toast.error('Agent profile not found');
      return null;
    }

    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...propertyData,
        agent_id: agentId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      toast.error('Failed to create property');
      return null;
    }

    setProperties((prev) => [data, ...prev]);
    toast.success('Property created successfully');
    return data;
  };

  const updateProperty = async (id: string, propertyData: PropertyUpdate) => {
    const { data, error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
      return null;
    }

    setProperties((prev) =>
      prev.map((p) => (p.id === id ? data : p))
    );
    toast.success('Property updated successfully');
    return data;
  };

  const deleteProperty = async (id: string) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
      return false;
    }

    setProperties((prev) => prev.filter((p) => p.id !== id));
    toast.success('Property deleted successfully');
    return true;
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
