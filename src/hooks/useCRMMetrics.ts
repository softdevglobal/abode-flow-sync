import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ActivityRecord {
  customer_id: string;
  type: 'inspection' | 'viewing' | 'bid';
  date: string;
  property_id?: string;
}

export interface CRMMetrics {
  totalLeads: number;
  customersWithInspections: number;
  customersWithViewings: number;
  customersWithBids: number;
  totalInspections: number;
  totalViewings: number;
  totalBids: number;
  inspectionToViewingRate: number;
  viewingToBidRate: number;
  inspectionToBidRate: number;
}

export type DateRangePreset = 'all' | '7d' | '30d' | '90d' | 'this_month' | 'last_month';

export function getDateRangeFromPreset(preset: DateRangePreset): DateRange | null {
  const now = new Date();
  
  switch (preset) {
    case 'all':
      return null;
    case '7d':
      return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
    case '30d':
      return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
    case '90d':
      return { from: startOfDay(subDays(now, 90)), to: endOfDay(now) };
    case 'this_month':
      return { from: startOfMonth(now), to: endOfDay(now) };
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    default:
      return null;
  }
}

export function useCRMMetrics(agentId: string | undefined, dateRange: DateRange | null) {
  return useQuery({
    queryKey: ['crm-metrics', agentId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async (): Promise<{ activities: ActivityRecord[]; customerIds: Set<string> }> => {
      if (!agentId) return { activities: [], customerIds: new Set() };

      const activities: ActivityRecord[] = [];
      const customerIds = new Set<string>();

      // Build date filter
      const dateFilter = dateRange ? {
        gte: dateRange.from.toISOString(),
        lte: dateRange.to.toISOString()
      } : null;

      // Fetch inspection bookings
      let inspectionQuery = supabase
        .from('inspection_bookings')
        .select(`
          customer_id,
          created_at,
          inspections!inner(
            property_id,
            properties!inner(agent_id)
          )
        `)
        .eq('inspections.properties.agent_id', agentId);

      if (dateFilter) {
        inspectionQuery = inspectionQuery.gte('created_at', dateFilter.gte).lte('created_at', dateFilter.lte);
      }

      const { data: inspections } = await inspectionQuery;
      
      inspections?.forEach(i => {
        customerIds.add(i.customer_id);
        activities.push({
          customer_id: i.customer_id,
          type: 'inspection',
          date: i.created_at,
          property_id: (i.inspections as any)?.property_id
        });
      });

      // Fetch viewing requests
      let viewingQuery = supabase
        .from('viewing_requests')
        .select('customer_id, created_at, property_id')
        .eq('agent_id', agentId);

      if (dateFilter) {
        viewingQuery = viewingQuery.gte('created_at', dateFilter.gte).lte('created_at', dateFilter.lte);
      }

      const { data: viewings } = await viewingQuery;
      
      viewings?.forEach(v => {
        customerIds.add(v.customer_id);
        activities.push({
          customer_id: v.customer_id,
          type: 'viewing',
          date: v.created_at,
          property_id: v.property_id
        });
      });

      // Fetch bids
      let bidQuery = supabase
        .from('bids')
        .select(`
          bidder_id,
          created_at,
          auctions!inner(
            property_id,
            properties!inner(agent_id)
          )
        `)
        .eq('auctions.properties.agent_id', agentId);

      if (dateFilter) {
        bidQuery = bidQuery.gte('created_at', dateFilter.gte).lte('created_at', dateFilter.lte);
      }

      const { data: bids } = await bidQuery;
      
      bids?.forEach(b => {
        customerIds.add(b.bidder_id);
        activities.push({
          customer_id: b.bidder_id,
          type: 'bid',
          date: b.created_at,
          property_id: (b.auctions as any)?.property_id
        });
      });

      return { activities, customerIds };
    },
    enabled: !!agentId,
  });
}

export function calculateMetricsFromActivities(
  activities: ActivityRecord[],
  customerIds: Set<string>
): CRMMetrics {
  const inspectionCustomers = new Set<string>();
  const viewingCustomers = new Set<string>();
  const bidCustomers = new Set<string>();
  
  let totalInspections = 0;
  let totalViewings = 0;
  let totalBids = 0;

  activities.forEach(activity => {
    switch (activity.type) {
      case 'inspection':
        inspectionCustomers.add(activity.customer_id);
        totalInspections++;
        break;
      case 'viewing':
        viewingCustomers.add(activity.customer_id);
        totalViewings++;
        break;
      case 'bid':
        bidCustomers.add(activity.customer_id);
        totalBids++;
        break;
    }
  });

  const customersWithInspections = inspectionCustomers.size;
  const customersWithViewings = viewingCustomers.size;
  const customersWithBids = bidCustomers.size;

  const inspectionToViewingRate = customersWithInspections > 0
    ? Math.round((customersWithViewings / customersWithInspections) * 100)
    : 0;
  const viewingToBidRate = customersWithViewings > 0
    ? Math.round((customersWithBids / customersWithViewings) * 100)
    : 0;
  const inspectionToBidRate = customersWithInspections > 0
    ? Math.round((customersWithBids / customersWithInspections) * 100)
    : 0;

  return {
    totalLeads: customerIds.size,
    customersWithInspections,
    customersWithViewings,
    customersWithBids,
    totalInspections,
    totalViewings,
    totalBids,
    inspectionToViewingRate,
    viewingToBidRate,
    inspectionToBidRate,
  };
}
