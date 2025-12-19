-- Create a public view for auctions that excludes reserve_price
CREATE OR REPLACE VIEW public.public_auctions AS
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

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_auctions TO anon, authenticated;

-- Drop the overly permissive public policies on the auctions table
DROP POLICY IF EXISTS "Public can view live and pending auctions" ON auctions;
DROP POLICY IF EXISTS "Prototype - view auctions" ON auctions;