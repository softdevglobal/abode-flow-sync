-- Allow agents to view profiles of customers who submitted appraisal requests
CREATE POLICY "Agents can view appraisal request customer profiles"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT customer_id 
    FROM appraisal_requests
  )
);