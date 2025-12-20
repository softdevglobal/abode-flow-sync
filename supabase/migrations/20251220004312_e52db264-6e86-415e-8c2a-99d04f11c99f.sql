-- Drop and recreate the view with explicit SECURITY INVOKER to satisfy linter
DROP VIEW IF EXISTS public.public_auctions;

CREATE VIEW public.public_auctions 
WITH (security_invoker = true) AS
SELECT 
  id, 
  property_id, 
  start_time, 
  end_time, 
  status, 
  current_bid, 
  min_increment, 
  created_at, 
  updated_at
FROM public.auctions
WHERE status IN ('live', 'pending');

-- Re-grant SELECT on the view
GRANT SELECT ON public.public_auctions TO anon, authenticated;