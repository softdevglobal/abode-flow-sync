-- Allow demo property creation for the shared demo agent
CREATE POLICY "Demo - insert properties for demo agent"
ON public.properties FOR INSERT
WITH CHECK (agent_id = 'da39b948-790b-4a66-94b4-394445a98062'::uuid);

-- Allow demo updates for the shared demo agent
CREATE POLICY "Demo - update properties for demo agent"
ON public.properties FOR UPDATE
USING (agent_id = 'da39b948-790b-4a66-94b4-394445a98062'::uuid)
WITH CHECK (agent_id = 'da39b948-790b-4a66-94b4-394445a98062'::uuid);

-- Allow demo deletes for the shared demo agent
CREATE POLICY "Demo - delete properties for demo agent"
ON public.properties FOR DELETE
USING (agent_id = 'da39b948-790b-4a66-94b4-394445a98062'::uuid);