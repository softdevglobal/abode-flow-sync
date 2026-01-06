-- Add a more permissive INSERT policy for prototyping
-- This allows authenticated users with agent role to insert properties
CREATE POLICY "Prototype - insert properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'agent'::app_role)
  AND agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);