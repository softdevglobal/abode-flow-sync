-- Add prototype policy for viewing viewing_requests
CREATE POLICY "Prototype - view viewing requests"
  ON public.viewing_requests
  FOR SELECT
  USING (agent_id IS NOT NULL);

-- Add prototype policy for updating viewing_requests  
CREATE POLICY "Prototype - update viewing requests"
  ON public.viewing_requests
  FOR UPDATE
  USING (agent_id IS NOT NULL);