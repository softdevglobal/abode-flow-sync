import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAcceptedPartners } from './useAgentNetwork';

const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

export function usePartnerMetrics() {
  const { data: partnerIds = [] } = useAcceptedPartners();

  return useQuery({
    queryKey: ['partner-metrics', DEMO_AGENT_ID, partnerIds],
    queryFn: async () => {
      if (partnerIds.length === 0) {
        return {
          activePartners: 0,
          partnerPropertyViews: 0,
          clientsOnPartnerProperties: 0,
          partnerInspectionBookings: 0,
        };
      }

      // Count active partners
      const activePartners = partnerIds.length;

      // Get partner properties
      const { data: partnerProperties } = await supabase
        .from('properties')
        .select('id')
        .in('agent_id', partnerIds)
        .eq('status', 'active');

      const partnerPropertyIds = partnerProperties?.map(p => p.id) || [];

      // Count inspection bookings on partner properties (past 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let partnerInspectionBookings = 0;
      if (partnerPropertyIds.length > 0) {
        // Get inspections for partner properties
        const { data: partnerInspections } = await supabase
          .from('inspections')
          .select('id')
          .in('property_id', partnerPropertyIds);

        const partnerInspectionIds = partnerInspections?.map(i => i.id) || [];

        if (partnerInspectionIds.length > 0) {
          const { count } = await supabase
            .from('inspection_bookings')
            .select('*', { count: 'exact', head: true })
            .in('inspection_id', partnerInspectionIds)
            .gte('created_at', sevenDaysAgo.toISOString());

          partnerInspectionBookings = count || 0;
        }
      }

      // Get my properties
      const { data: myProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('agent_id', DEMO_AGENT_ID)
        .eq('status', 'active');

      const myPropertyIds = myProperties?.map(p => p.id) || [];

      // Count viewing requests from partner clients on my properties (past 7 days)
      let clientsOnPartnerProperties = 0;
      if (myPropertyIds.length > 0) {
        const { count } = await supabase
          .from('viewing_requests')
          .select('*', { count: 'exact', head: true })
          .in('property_id', myPropertyIds)
          .in('agent_id', partnerIds)
          .gte('created_at', sevenDaysAgo.toISOString());

        clientsOnPartnerProperties = count || 0;
      }

      return {
        activePartners,
        partnerPropertyViews: partnerPropertyIds.length,
        clientsOnPartnerProperties,
        partnerInspectionBookings,
      };
    },
    enabled: true,
  });
}
