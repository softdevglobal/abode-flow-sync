-- Recreate as PERMISSIVE policies for prototype mode (policies are permissive by default)
CREATE POLICY "Prototype - view auctions"
ON public.auctions FOR SELECT
USING (true);

CREATE POLICY "Prototype - insert auctions"
ON public.auctions FOR INSERT
WITH CHECK (
  property_id IN (SELECT id FROM properties WHERE agent_id IS NOT NULL)
);

CREATE POLICY "Prototype - update auctions"
ON public.auctions FOR UPDATE
USING (
  property_id IN (SELECT id FROM properties WHERE agent_id IS NOT NULL)
)
WITH CHECK (
  property_id IN (SELECT id FROM properties WHERE agent_id IS NOT NULL)
);

CREATE POLICY "Prototype - delete auctions"
ON public.auctions FOR DELETE
USING (
  property_id IN (SELECT id FROM properties WHERE agent_id IS NOT NULL)
);