-- Add foreign key relationship between appraisal_requests and profiles
ALTER TABLE public.appraisal_requests
ADD CONSTRAINT appraisal_requests_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add prototype RLS policy for buyers to view their appraisal requests
CREATE POLICY "Prototype - buyers view their requests"
  ON public.appraisal_requests
  FOR SELECT
  TO authenticated
  USING (customer_id IS NOT NULL);

-- Add prototype RLS policy for buyers to insert appraisal requests  
CREATE POLICY "Prototype - buyers create requests"
  ON public.appraisal_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);