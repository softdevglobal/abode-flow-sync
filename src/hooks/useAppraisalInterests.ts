import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppraisalInterest {
  id: string;
  appraisal_id: string;
  customer_id: string;
  status: string;
  message: string | null;
  offer_amount: number | null;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
  appraisal: {
    id: string;
    address: string;
    suburb: string;
    state: string;
    postcode: string;
    price_from: number;
    price_to: number;
    images: string[];
    property_type: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parking: number | null;
  };
}

export function useAppraisalInterests(agentId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: interests, isLoading } = useQuery({
    queryKey: ['appraisal-interests', agentId],
    queryFn: async (): Promise<AppraisalInterest[]> => {
      if (!agentId) return [];

      // Fetch appraisal interests for this agent's appraisals
      const { data, error } = await supabase
        .from('appraisal_interests')
        .select(`
          id,
          appraisal_id,
          customer_id,
          status,
          message,
          offer_amount,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Get unique appraisal IDs
      const appraisalIds = [...new Set(data.map(i => i.appraisal_id))];
      
      // Fetch appraisals for this agent
      const { data: appraisals } = await supabase
        .from('appraisals')
        .select('id, address, suburb, state, postcode, price_from, price_to, images, property_type, bedrooms, bathrooms, parking')
        .eq('agent_id', agentId)
        .in('id', appraisalIds);

      if (!appraisals || appraisals.length === 0) return [];

      // Create a map of appraisals by ID
      const appraisalMap = new Map(appraisals.map(a => [a.id, a]));

      // Get unique customer IDs from matching appraisals
      const matchingInterests = data.filter(i => appraisalMap.has(i.appraisal_id));
      const customerIds = [...new Set(matchingInterests.map(i => i.customer_id))];

      // Fetch customer profiles
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone')
        .in('id', customerIds);

      const customerMap = new Map(customers?.map(c => [c.id, c]) || []);

      // Combine the data
      return matchingInterests.map(interest => ({
        ...interest,
        customer: customerMap.get(interest.customer_id) || {
          id: interest.customer_id,
          email: 'Unknown',
          first_name: null,
          last_name: null,
          phone: null,
        },
        appraisal: appraisalMap.get(interest.appraisal_id)!,
      }));
    },
    enabled: !!agentId,
  });

  // Update interest status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ interestId, status }: { interestId: string; status: string }) => {
      const { error } = await supabase
        .from('appraisal_interests')
        .update({ status })
        .eq('id', interestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appraisal-interests', agentId] });
    },
  });

  return {
    interests: interests || [],
    isLoading,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
}
