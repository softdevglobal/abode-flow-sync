import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProposedDate {
  date: string;
  times: string[];
}

export interface InspectionInvitation {
  id: string;
  appraisal_interest_id: string;
  appraisal_id: string;
  agent_id: string;
  customer_id: string;
  proposed_dates: ProposedDate[];
  agent_message: string | null;
  selected_date: string | null;
  selected_time: string | null;
  buyer_message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useInspectionInvitations(agentId: string | null) {
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['inspection-invitations', agentId],
    queryFn: async (): Promise<InspectionInvitation[]> => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('inspection_invitations')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(inv => ({
        ...inv,
        proposed_dates: inv.proposed_dates as unknown as ProposedDate[],
      }));
    },
    enabled: !!agentId,
  });

  const createInvitation = useMutation({
    mutationFn: async ({
      appraisalInterestId,
      appraisalId,
      agentId,
      customerId,
      proposedDates,
      agentMessage,
    }: {
      appraisalInterestId: string;
      appraisalId: string;
      agentId: string;
      customerId: string;
      proposedDates: ProposedDate[];
      agentMessage?: string;
    }) => {
      const { error } = await supabase
        .from('inspection_invitations')
        .insert({
          appraisal_interest_id: appraisalInterestId,
          appraisal_id: appraisalId,
          agent_id: agentId,
          customer_id: customerId,
          proposed_dates: proposedDates as unknown as any,
          agent_message: agentMessage || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-invitations'] });
    },
  });

  return {
    invitations,
    isLoading,
    createInvitation: createInvitation.mutateAsync,
    isCreating: createInvitation.isPending,
  };
}

export function useBuyerInvitations(customerId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['buyer-inspection-invitations', customerId],
    queryFn: async (): Promise<(InspectionInvitation & { appraisal: any })[]> => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from('inspection_invitations')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch appraisal details
      const appraisalIds = [...new Set(data.map(inv => inv.appraisal_id))];
      const { data: appraisals } = await supabase
        .from('appraisals')
        .select('*')
        .in('id', appraisalIds);

      const appraisalMap = new Map(appraisals?.map(a => [a.id, a]) || []);

      return (data || []).map(inv => ({
        ...inv,
        proposed_dates: inv.proposed_dates as unknown as ProposedDate[],
        appraisal: appraisalMap.get(inv.appraisal_id) || null,
      }));
    },
    enabled: !!customerId,
  });

  const confirmInvitation = useMutation({
    mutationFn: async ({
      invitationId,
      selectedDate,
      selectedTime,
      buyerMessage,
    }: {
      invitationId: string;
      selectedDate: string;
      selectedTime: string;
      buyerMessage?: string;
    }) => {
      const { error } = await supabase
        .from('inspection_invitations')
        .update({
          selected_date: selectedDate,
          selected_time: selectedTime,
          buyer_message: buyerMessage || null,
          status: 'confirmed',
        })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-inspection-invitations'] });
    },
  });

  return {
    invitations,
    isLoading,
    confirmInvitation: confirmInvitation.mutateAsync,
    isConfirming: confirmInvitation.isPending,
  };
}
