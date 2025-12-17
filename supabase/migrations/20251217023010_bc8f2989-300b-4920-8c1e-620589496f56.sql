-- Add prototype-friendly policy for updating agent theme settings
CREATE POLICY "Prototype - update agent theme settings"
ON public.agents FOR UPDATE
USING (id IS NOT NULL)
WITH CHECK (id IS NOT NULL);