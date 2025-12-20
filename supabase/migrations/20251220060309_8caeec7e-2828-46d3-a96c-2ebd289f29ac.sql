-- Add public policy for viewing auctions (allows buyers to see live/pending/sold auctions)
CREATE POLICY "Public can view auctions"
ON public.auctions
FOR SELECT
USING (status IN ('live', 'pending', 'sold', 'passed_in'));

-- Add prototype policy for viewing auctions (for development/prototype access)
CREATE POLICY "Prototype - view auctions"
ON public.auctions
FOR SELECT
USING (property_id IN (
  SELECT properties.id
  FROM properties
  WHERE properties.agent_id IS NOT NULL
));