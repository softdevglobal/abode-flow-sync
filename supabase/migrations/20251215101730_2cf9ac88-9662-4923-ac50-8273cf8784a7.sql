-- Add permissive prototype policy for property updates
CREATE POLICY "Prototype - update properties"
ON public.properties
FOR UPDATE
USING (agent_id IS NOT NULL)
WITH CHECK (agent_id IS NOT NULL);