-- Add prototype policy for profiles to allow viewing in demo mode
CREATE POLICY "Prototype - view profiles for appraisal interests" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT DISTINCT customer_id 
    FROM appraisal_interests 
    WHERE appraisal_id IS NOT NULL
  )
);