-- Drop the restrictive prototype UPDATE policy
DROP POLICY IF EXISTS "Allow auction updates for agent properties (prototype)" ON public.auctions;

-- Create a PERMISSIVE prototype UPDATE policy
CREATE POLICY "Prototype - allow auction updates"
ON public.auctions
FOR UPDATE
TO public
USING (
  property_id IN (
    SELECT id FROM properties WHERE agent_id IS NOT NULL
  )
)
WITH CHECK (
  property_id IN (
    SELECT id FROM properties WHERE agent_id IS NOT NULL
  )
);