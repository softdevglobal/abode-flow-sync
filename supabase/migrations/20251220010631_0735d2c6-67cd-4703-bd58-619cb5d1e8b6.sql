-- Create rate_limits table to track request counts
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP address or user ID
  endpoint_type text NOT NULL, -- 'auth' or 'api'
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique index for fast lookups
CREATE UNIQUE INDEX idx_rate_limits_identifier_endpoint ON public.rate_limits (identifier, endpoint_type);

-- Create index for cleanup queries
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits (window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow the service role to manage rate limits (edge functions use service role)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint_type text,
  p_max_requests integer,
  p_window_seconds integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record rate_limits%ROWTYPE;
  v_window_start timestamp with time zone;
  v_result jsonb;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;
  
  -- Try to get existing record
  SELECT * INTO v_record
  FROM rate_limits
  WHERE identifier = p_identifier 
    AND endpoint_type = p_endpoint_type
  FOR UPDATE;
  
  IF v_record.id IS NULL THEN
    -- No record exists, create one
    INSERT INTO rate_limits (identifier, endpoint_type, request_count, window_start)
    VALUES (p_identifier, p_endpoint_type, 1, now())
    RETURNING * INTO v_record;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_max_requests - 1,
      'reset_at', extract(epoch from v_record.window_start + (p_window_seconds || ' seconds')::interval)::bigint
    );
  END IF;
  
  -- Check if window has expired
  IF v_record.window_start < v_window_start THEN
    -- Reset the window
    UPDATE rate_limits
    SET request_count = 1, window_start = now()
    WHERE id = v_record.id
    RETURNING * INTO v_record;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_max_requests - 1,
      'reset_at', extract(epoch from v_record.window_start + (p_window_seconds || ' seconds')::interval)::bigint
    );
  END IF;
  
  -- Check if limit exceeded
  IF v_record.request_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_at', extract(epoch from v_record.window_start + (p_window_seconds || ' seconds')::interval)::bigint
    );
  END IF;
  
  -- Increment counter
  UPDATE rate_limits
  SET request_count = request_count + 1
  WHERE id = v_record.id
  RETURNING * INTO v_record;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_max_requests - v_record.request_count,
    'reset_at', extract(epoch from v_record.window_start + (p_window_seconds || ' seconds')::interval)::bigint
  );
END;
$$;

-- Cleanup function to remove old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '5 minutes';
END;
$$;