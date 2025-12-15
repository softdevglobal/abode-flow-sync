-- Add prototype-friendly INSERT policy for bids table
-- This allows agents to record manual bids for in-room bidders during live auctions

CREATE POLICY "Allow bid creation for live auctions (prototype)"
ON public.bids FOR INSERT
WITH CHECK (
  auction_id IN (
    SELECT id FROM public.auctions WHERE status = 'live'
  )
);