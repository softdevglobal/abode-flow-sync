import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CRMCustomer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  inspection_count: number;
  viewing_count: number;
  bid_count: number;
  last_interaction: string | null;
  lead_score: number;
}

// Lead scoring weights
const LEAD_SCORE_WEIGHTS = {
  bid: 30,           // Highest buying intent
  viewing: 15,       // Medium intent
  inspection: 10,    // Initial interest
  recency_7_days: 20,  // Very recent activity bonus
  recency_30_days: 10, // Recent activity bonus
};

export function calculateLeadScore(
  inspectionCount: number,
  viewingCount: number,
  bidCount: number,
  lastInteraction: string | null
): number {
  let score = 0;
  
  // Activity scores
  score += bidCount * LEAD_SCORE_WEIGHTS.bid;
  score += viewingCount * LEAD_SCORE_WEIGHTS.viewing;
  score += inspectionCount * LEAD_SCORE_WEIGHTS.inspection;
  
  // Recency bonus
  if (lastInteraction) {
    const daysSinceInteraction = Math.floor(
      (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceInteraction <= 7) {
      score += LEAD_SCORE_WEIGHTS.recency_7_days;
    } else if (daysSinceInteraction <= 30) {
      score += LEAD_SCORE_WEIGHTS.recency_30_days;
    }
  }
  
  return score;
}

export function getLeadScoreLabel(score: number): { label: string; color: string } {
  if (score >= 60) return { label: 'Hot', color: '#ef4444' };
  if (score >= 30) return { label: 'Warm', color: '#f97316' };
  if (score >= 10) return { label: 'Cool', color: '#3b82f6' };
  return { label: 'New', color: '#6b7280' };
}

export interface CRMNote {
  id: string;
  agent_id: string;
  customer_id: string;
  note_type: 'call' | 'email' | 'meeting' | 'follow_up' | 'general';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerInteraction {
  id: string;
  type: 'inspection' | 'viewing_request' | 'bid';
  date: string;
  details: string;
  status?: string;
  property_title?: string;
  property_id?: string;
  amount?: number;
}

export interface CRMTag {
  id: string;
  agent_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CustomerTag {
  id: string;
  tag_id: string;
  customer_id: string;
}

export function useAgentCRM(agentId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch all customers who have interacted with agent's properties
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['crm-customers', agentId],
    queryFn: async (): Promise<CRMCustomer[]> => {
      if (!agentId) return [];

      // Get customers from inspection bookings
      const { data: inspectionCustomers } = await supabase
        .from('inspection_bookings')
        .select(`
          customer_id,
          inspections!inner(
            property_id,
            properties!inner(agent_id)
          )
        `)
        .eq('inspections.properties.agent_id', agentId);

      // Get customers from viewing requests
      const { data: viewingCustomers } = await supabase
        .from('viewing_requests')
        .select('customer_id')
        .eq('agent_id', agentId);

      // Get customers from bids on agent's auctions
      const { data: bidCustomers } = await supabase
        .from('bids')
        .select(`
          bidder_id,
          auctions!inner(
            property_id,
            properties!inner(agent_id)
          )
        `)
        .eq('auctions.properties.agent_id', agentId);

      // Combine unique customer IDs
      const customerIds = new Set<string>();
      inspectionCustomers?.forEach(c => customerIds.add(c.customer_id));
      viewingCustomers?.forEach(c => customerIds.add(c.customer_id));
      bidCustomers?.forEach(c => customerIds.add(c.bidder_id));

      if (customerIds.size === 0) return [];

      // Fetch profiles for these customers
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(customerIds));

      if (!profiles) return [];

      // Count interactions per customer
      const inspectionCounts = new Map<string, number>();
      const viewingCounts = new Map<string, number>();
      const bidCounts = new Map<string, number>();
      const lastInteractions = new Map<string, string>();

      inspectionCustomers?.forEach(c => {
        inspectionCounts.set(c.customer_id, (inspectionCounts.get(c.customer_id) || 0) + 1);
      });
      viewingCustomers?.forEach(c => {
        viewingCounts.set(c.customer_id, (viewingCounts.get(c.customer_id) || 0) + 1);
      });
      bidCustomers?.forEach(c => {
        bidCounts.set(c.bidder_id, (bidCounts.get(c.bidder_id) || 0) + 1);
      });

      // Get last interaction dates
      for (const customerId of customerIds) {
        const dates: string[] = [];
        
        const { data: lastInspection } = await supabase
          .from('inspection_bookings')
          .select('created_at')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const { data: lastViewing } = await supabase
          .from('viewing_requests')
          .select('created_at')
          .eq('customer_id', customerId)
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastInspection) dates.push(lastInspection.created_at);
        if (lastViewing) dates.push(lastViewing.created_at);
        
        if (dates.length > 0) {
          lastInteractions.set(customerId, dates.sort().reverse()[0]);
        }
      }

      return profiles.map(profile => {
        const inspections = inspectionCounts.get(profile.id) || 0;
        const viewings = viewingCounts.get(profile.id) || 0;
        const bids = bidCounts.get(profile.id) || 0;
        const lastInt = lastInteractions.get(profile.id) || null;
        
        return {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          inspection_count: inspections,
          viewing_count: viewings,
          bid_count: bids,
          last_interaction: lastInt,
          lead_score: calculateLeadScore(inspections, viewings, bids, lastInt),
        };
      });
    },
    enabled: !!agentId,
  });

  // Fetch all tags for this agent
  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['crm-tags', agentId],
    queryFn: async (): Promise<CRMTag[]> => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('crm_tags')
        .select('*')
        .eq('agent_id', agentId)
        .order('name');

      if (error) throw error;
      return (data || []) as CRMTag[];
    },
    enabled: !!agentId,
  });

  // Fetch customer tags mapping
  const { data: customerTagsMap } = useQuery({
    queryKey: ['customer-tags-map', agentId],
    queryFn: async (): Promise<Map<string, string[]>> => {
      if (!agentId) return new Map();

      const { data, error } = await supabase
        .from('customer_tags')
        .select('customer_id, tag_id')
        .eq('agent_id', agentId);

      if (error) throw error;
      
      const map = new Map<string, string[]>();
      data?.forEach(ct => {
        const existing = map.get(ct.customer_id) || [];
        existing.push(ct.tag_id);
        map.set(ct.customer_id, existing);
      });
      return map;
    },
    enabled: !!agentId,
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!agentId) throw new Error('Missing agent ID');

      const { error } = await supabase
        .from('crm_tags')
        .insert({ agent_id: agentId, name: name.trim(), color });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tags', agentId] });
    },
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('crm_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tags', agentId] });
      queryClient.invalidateQueries({ queryKey: ['customer-tags-map', agentId] });
    },
  });

  return {
    customers: customers || [],
    customersLoading,
    tags: tags || [],
    tagsLoading,
    customerTagsMap: customerTagsMap || new Map(),
    createTag: createTagMutation.mutateAsync,
    isCreatingTag: createTagMutation.isPending,
    deleteTag: deleteTagMutation.mutateAsync,
    isDeletingTag: deleteTagMutation.isPending,
  };
}

export function useCustomerDetails(agentId: string | undefined, customerId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch customer interactions
  const { data: interactions, isLoading: interactionsLoading } = useQuery({
    queryKey: ['crm-interactions', agentId, customerId],
    queryFn: async (): Promise<CustomerInteraction[]> => {
      if (!agentId || !customerId) return [];

      const allInteractions: CustomerInteraction[] = [];

      // Get inspection bookings
      const { data: inspections } = await supabase
        .from('inspection_bookings')
        .select(`
          id,
          created_at,
          status,
          checked_in_at,
          inspections!inner(
            date_time,
            property_id,
            properties!inner(
              id,
              title,
              agent_id
            )
          )
        `)
        .eq('customer_id', customerId)
        .eq('inspections.properties.agent_id', agentId)
        .order('created_at', { ascending: false });

      inspections?.forEach(booking => {
        const inspection = booking.inspections as any;
        allInteractions.push({
          id: booking.id,
          type: 'inspection',
          date: booking.created_at,
          details: booking.checked_in_at ? 'Attended inspection' : `RSVP'd for inspection`,
          status: booking.status,
          property_title: inspection?.properties?.title,
          property_id: inspection?.properties?.id,
        });
      });

      // Get viewing requests
      const { data: viewings } = await supabase
        .from('viewing_requests')
        .select(`
          id,
          created_at,
          status,
          requested_date,
          requested_time,
          message,
          properties!inner(
            id,
            title
          )
        `)
        .eq('customer_id', customerId)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      viewings?.forEach(viewing => {
        const property = viewing.properties as any;
        allInteractions.push({
          id: viewing.id,
          type: 'viewing_request',
          date: viewing.created_at,
          details: `Requested viewing for ${viewing.requested_date} at ${viewing.requested_time}`,
          status: viewing.status,
          property_title: property?.title,
          property_id: property?.id,
        });
      });

      // Get bids
      const { data: bids } = await supabase
        .from('bids')
        .select(`
          id,
          created_at,
          amount,
          auctions!inner(
            property_id,
            properties!inner(
              id,
              title,
              agent_id
            )
          )
        `)
        .eq('bidder_id', customerId)
        .eq('auctions.properties.agent_id', agentId)
        .order('created_at', { ascending: false });

      bids?.forEach(bid => {
        const auction = bid.auctions as any;
        allInteractions.push({
          id: bid.id,
          type: 'bid',
          date: bid.created_at,
          details: `Placed bid`,
          amount: bid.amount,
          property_title: auction?.properties?.title,
          property_id: auction?.properties?.id,
        });
      });

      // Sort by date descending
      return allInteractions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
    enabled: !!agentId && !!customerId,
  });

  // Fetch CRM notes
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['crm-notes', agentId, customerId],
    queryFn: async (): Promise<CRMNote[]> => {
      if (!agentId || !customerId) return [];

      const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .eq('agent_id', agentId)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CRMNote[];
    },
    enabled: !!agentId && !!customerId,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ 
      noteType, 
      content 
    }: { 
      noteType: CRMNote['note_type']; 
      content: string;
    }) => {
      if (!agentId || !customerId) throw new Error('Missing agent or customer ID');

      const { error } = await supabase
        .from('crm_notes')
        .insert({
          agent_id: agentId,
          customer_id: customerId,
          note_type: noteType,
          content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-notes', agentId, customerId] });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('crm_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-notes', agentId, customerId] });
    },
  });

  // Fetch customer's tags
  const { data: customerTags, isLoading: customerTagsLoading } = useQuery({
    queryKey: ['customer-tags', agentId, customerId],
    queryFn: async (): Promise<string[]> => {
      if (!agentId || !customerId) return [];

      const { data, error } = await supabase
        .from('customer_tags')
        .select('tag_id')
        .eq('agent_id', agentId)
        .eq('customer_id', customerId);

      if (error) throw error;
      return data?.map(ct => ct.tag_id) || [];
    },
    enabled: !!agentId && !!customerId,
  });

  // Assign tag mutation
  const assignTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (!agentId || !customerId) throw new Error('Missing IDs');

      const { error } = await supabase
        .from('customer_tags')
        .insert({ agent_id: agentId, customer_id: customerId, tag_id: tagId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-tags', agentId, customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-tags-map', agentId] });
    },
  });

  // Remove tag mutation
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (!agentId || !customerId) throw new Error('Missing IDs');

      const { error } = await supabase
        .from('customer_tags')
        .delete()
        .eq('agent_id', agentId)
        .eq('customer_id', customerId)
        .eq('tag_id', tagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-tags', agentId, customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-tags-map', agentId] });
    },
  });

  return {
    interactions: interactions || [],
    interactionsLoading,
    notes: notes || [],
    notesLoading,
    addNote: addNoteMutation.mutateAsync,
    isAddingNote: addNoteMutation.isPending,
    deleteNote: deleteNoteMutation.mutateAsync,
    isDeletingNote: deleteNoteMutation.isPending,
    customerTags: customerTags || [],
    customerTagsLoading,
    assignTag: assignTagMutation.mutateAsync,
    isAssigningTag: assignTagMutation.isPending,
    removeTag: removeTagMutation.mutateAsync,
    isRemovingTag: removeTagMutation.isPending,
  };
}
