import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Fallback demo agent ID for prototype mode when not logged in as an agent
const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

export function useCurrentAgent() {
  const { user } = useAuth();

  // Demo mode: always use the demo agent ID for all users
  // This ensures everyone sees the same demo data without needing to create agent records
  return {
    agentId: DEMO_AGENT_ID,
    agent: null,
    isLoading: false,
    isDemo: true,
    userId: user?.id,
  };
}
