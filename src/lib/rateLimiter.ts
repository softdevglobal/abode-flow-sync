import { supabase } from '@/integrations/supabase/client';

type EndpointType = 'auth' | 'api';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at?: number;
  error?: string;
}

/**
 * Check rate limit before making a request
 * @param endpointType - 'auth' for authentication (5/min) or 'api' for general API (30/min)
 * @param identifier - Optional custom identifier (defaults to using IP via edge function)
 * @returns RateLimitResult with allowed status and remaining requests
 */
export async function checkRateLimit(
  endpointType: EndpointType,
  identifier?: string
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: { 
        endpoint_type: endpointType,
        identifier 
      },
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      // On error, allow the request but log it
      return { allowed: true, remaining: -1, error: error.message };
    }

    return data as RateLimitResult;
  } catch (err) {
    console.error('Rate limit check error:', err);
    // On error, allow the request
    return { allowed: true, remaining: -1, error: 'Rate limit check failed' };
  }
}

/**
 * Higher-order function to wrap async operations with rate limiting
 * @param endpointType - 'auth' or 'api'
 * @param operation - The async operation to execute if rate limit allows
 * @param onRateLimited - Callback when rate limited
 */
export async function withRateLimit<T>(
  endpointType: EndpointType,
  operation: () => Promise<T>,
  onRateLimited?: (result: RateLimitResult) => void
): Promise<T | null> {
  const rateLimitResult = await checkRateLimit(endpointType);

  if (!rateLimitResult.allowed) {
    onRateLimited?.(rateLimitResult);
    return null;
  }

  return operation();
}
