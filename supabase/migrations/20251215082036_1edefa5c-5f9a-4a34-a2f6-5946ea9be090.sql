-- Add prototype-friendly INSERT policy for auctions
-- This allows inserting auctions when the property belongs to any agent
-- In production, this would require proper authentication

CREATE POLICY "Allow auction creation for agent properties (prototype)"
ON public.auctions FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE agent_id IS NOT NULL
  )
);

-- Also add UPDATE policy for prototype mode
CREATE POLICY "Allow auction updates for agent properties (prototype)"
ON public.auctions FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE agent_id IS NOT NULL
  )
);

-- Add DELETE policy for prototype mode
CREATE POLICY "Allow auction deletion for agent properties (prototype)"
ON public.auctions FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE agent_id IS NOT NULL
  )
);