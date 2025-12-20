-- Drop existing policy and recreate with appraisal_interests included
DROP POLICY IF EXISTS "Agents can view customer profiles" ON public.profiles;

CREATE POLICY "Agents can view customer profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- From inspection bookings
  (id IN ( 
    SELECT DISTINCT ib.customer_id
    FROM inspection_bookings ib
    JOIN inspections i ON ib.inspection_id = i.id
    JOIN properties p ON i.property_id = p.id
    WHERE p.agent_id = get_agent_id(auth.uid())
  )) 
  OR 
  -- From viewing requests
  (id IN ( 
    SELECT DISTINCT viewing_requests.customer_id
    FROM viewing_requests
    WHERE viewing_requests.agent_id = get_agent_id(auth.uid())
  )) 
  OR 
  -- From bids on auctions
  (id IN ( 
    SELECT DISTINCT b.bidder_id
    FROM bids b
    JOIN auctions a ON b.auction_id = a.id
    JOIN properties p ON a.property_id = p.id
    WHERE p.agent_id = get_agent_id(auth.uid())
  ))
  OR
  -- From appraisal interests (NEW)
  (id IN (
    SELECT DISTINCT ai.customer_id
    FROM appraisal_interests ai
    JOIN appraisals ap ON ai.appraisal_id = ap.id
    WHERE ap.agent_id = get_agent_id(auth.uid())
  ))
);