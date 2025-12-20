import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
};

// Rate limits configuration
const RATE_LIMITS = {
  auth: { maxRequests: 5, windowSeconds: 60 },    // 5 requests per minute
  api: { maxRequests: 30, windowSeconds: 60 },    // 30 requests per minute
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const { endpoint_type, identifier } = body;

    // Validate endpoint type
    if (!endpoint_type || !['auth', 'api'].includes(endpoint_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint_type. Must be "auth" or "api".' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get client identifier (IP address from headers or provided identifier)
    const clientIdentifier = identifier || 
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    console.log(`Rate limit check for ${endpoint_type}: ${clientIdentifier}`);

    // Get rate limit config
    const config = RATE_LIMITS[endpoint_type as keyof typeof RATE_LIMITS];

    // Check rate limit using database function
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: clientIdentifier,
      p_endpoint_type: endpoint_type,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request but log it
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          remaining: config.maxRequests,
          error: 'Rate limit check failed, allowing request'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = data as { allowed: boolean; remaining: number; reset_at: number };
    
    console.log(`Rate limit result for ${clientIdentifier}:`, result);

    // Build response headers
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset_at.toString(),
    };

    if (!result.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          allowed: false,
          remaining: 0,
          reset_at: result.reset_at,
          retry_after: Math.ceil(result.reset_at - Date.now() / 1000),
        }),
        { 
          status: 429,
          headers: {
            ...responseHeaders,
            'Retry-After': Math.ceil(result.reset_at - Date.now() / 1000).toString(),
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: result.remaining,
        reset_at: result.reset_at,
      }),
      { 
        status: 200, 
        headers: responseHeaders 
      }
    );

  } catch (error) {
    console.error('Rate limiter error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', allowed: true }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
