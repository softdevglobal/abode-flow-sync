import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Fallback demo agent ID for prototype mode when not logged in as an agent
const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

export function useCurrentAgent() {
  const { user } = useAuth();

  const { data: agent, isLoading } = useQuery({
    queryKey: ['current-agent', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Try to get agent record for the current user
      const { data, error } = await supabase
        .from('agents')
        .select('id, user_id, agency_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching agent:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  // Return the agent ID - use demo agent if no agent record found for current user
  const agentId = agent?.id || DEMO_AGENT_ID;
  const isDemo = !agent?.id;

  return {
    agentId,
    agent,
    isLoading,
    isDemo, // Flag to indicate we're using demo data
    userId: user?.id,
  };
}
