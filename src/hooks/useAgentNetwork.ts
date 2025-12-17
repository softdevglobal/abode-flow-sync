import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

export interface Partnership {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  partner?: {
    id: string;
    agency_name: string | null;
    theme_agency_name: string | null;
    profile_image: string | null;
    user_id: string;
  };
}

export interface AgentSearchResult {
  id: string;
  agency_name: string | null;
  theme_agency_name: string | null;
  profile_image: string | null;
  user_id: string;
}

export function useAgentSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['agent-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('agents')
        .select('id, agency_name, theme_agency_name, profile_image, user_id')
        .or(`agency_name.ilike.%${searchTerm}%,theme_agency_name.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      return data as AgentSearchResult[];
    },
    enabled: searchTerm.length >= 2,
  });
}

export function useMyPartnerships() {
  return useQuery({
    queryKey: ['my-partnerships', DEMO_AGENT_ID],
    queryFn: async () => {
      // Get partnerships where I'm the requester
      const { data: sentData, error: sentError } = await supabase
        .from('agent_partnerships')
        .select('*')
        .eq('requester_id', DEMO_AGENT_ID);

      if (sentError) throw sentError;

      // Get partnerships where I'm the receiver
      const { data: receivedData, error: receivedError } = await supabase
        .from('agent_partnerships')
        .select('*')
        .eq('receiver_id', DEMO_AGENT_ID);

      if (receivedError) throw receivedError;

      // Get all partner agent IDs
      const partnerIds = new Set<string>();
      sentData?.forEach(p => partnerIds.add(p.receiver_id));
      receivedData?.forEach(p => partnerIds.add(p.requester_id));

      // Fetch partner details
      let partners: Record<string, AgentSearchResult> = {};
      if (partnerIds.size > 0) {
        const { data: agentsData } = await supabase
          .from('agents')
          .select('id, agency_name, theme_agency_name, profile_image, user_id')
          .in('id', Array.from(partnerIds));
        
        agentsData?.forEach(agent => {
          partners[agent.id] = agent;
        });
      }

      // Combine and enrich partnerships
      const sent = sentData?.map(p => ({
        ...p,
        status: p.status as Partnership['status'],
        partner: partners[p.receiver_id],
        direction: 'sent' as const,
      })) || [];

      const received = receivedData?.map(p => ({
        ...p,
        status: p.status as Partnership['status'],
        partner: partners[p.requester_id],
        direction: 'received' as const,
      })) || [];

      return { sent, received };
    },
  });
}

export function useAcceptedPartners() {
  return useQuery({
    queryKey: ['accepted-partners', DEMO_AGENT_ID],
    queryFn: async () => {
      // Get accepted partnerships where I'm the requester
      const { data: sentData, error: sentError } = await supabase
        .from('agent_partnerships')
        .select('receiver_id')
        .eq('requester_id', DEMO_AGENT_ID)
        .eq('status', 'accepted');

      if (sentError) throw sentError;

      // Get accepted partnerships where I'm the receiver
      const { data: receivedData, error: receivedError } = await supabase
        .from('agent_partnerships')
        .select('requester_id')
        .eq('receiver_id', DEMO_AGENT_ID)
        .eq('status', 'accepted');

      if (receivedError) throw receivedError;

      // Collect all partner agent IDs
      const partnerIds: string[] = [
        ...(sentData?.map(p => p.receiver_id) || []),
        ...(receivedData?.map(p => p.requester_id) || []),
      ];

      return partnerIds;
    },
  });
}

export function useSendPartnerRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiverId: string) => {
      const { data, error } = await supabase
        .from('agent_partnerships')
        .insert({
          requester_id: DEMO_AGENT_ID,
          receiver_id: receiverId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-partnerships'] });
    },
  });
}

export function useRespondToPartnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partnershipId, status }: { partnershipId: string; status: 'accepted' | 'rejected' }) => {
      const { data, error } = await supabase
        .from('agent_partnerships')
        .update({ status })
        .eq('id', partnershipId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-partnerships'] });
      queryClient.invalidateQueries({ queryKey: ['accepted-partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner-metrics'] });
    },
  });
}

export function useRemovePartnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partnershipId: string) => {
      const { error } = await supabase
        .from('agent_partnerships')
        .delete()
        .eq('id', partnershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-partnerships'] });
      queryClient.invalidateQueries({ queryKey: ['accepted-partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner-metrics'] });
    },
  });
}
