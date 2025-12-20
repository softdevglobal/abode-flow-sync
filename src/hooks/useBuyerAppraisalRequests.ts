import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppraisalRequestStatus = 'pending' | 'contacted' | 'completed' | 'cancelled';

export interface AppraisalRequest {
  id: string;
  customer_id: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  land_size: number | null;
  notes: string | null;
  status: AppraisalRequestStatus;
  created_at: string;
  updated_at: string;
}

interface UseBuyerAppraisalRequestsOptions {
  status?: AppraisalRequestStatus | 'all';
  sortBy?: 'created_at' | 'updated_at' | 'suburb';
  sortOrder?: 'asc' | 'desc';
}

export function useBuyerAppraisalRequests(options: UseBuyerAppraisalRequestsOptions = {}) {
  const { user } = useAuth();
  const { status = 'all', sortBy = 'created_at', sortOrder = 'desc' } = options;

  return useQuery({
    queryKey: ['buyer-appraisal-requests', user?.id, status, sortBy, sortOrder],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('appraisal_requests')
        .select('*')
        .eq('customer_id', user.id);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AppraisalRequest[];
    },
    enabled: !!user,
  });
}

export function useAppraisalRequestStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['buyer-appraisal-request-stats', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, pending: 0, contacted: 0, completed: 0 };

      const { data, error } = await supabase
        .from('appraisal_requests')
        .select('status')
        .eq('customer_id', user.id);

      if (error) throw error;

      const requests = data || [];
      return {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        contacted: requests.filter(r => r.status === 'contacted').length,
        completed: requests.filter(r => r.status === 'completed').length,
      };
    },
    enabled: !!user,
  });
}
