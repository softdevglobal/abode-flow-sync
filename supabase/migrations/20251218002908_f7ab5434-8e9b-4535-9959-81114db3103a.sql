-- Create table for buyer interest/offers on pre-market appraisals
CREATE TABLE public.appraisal_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_id uuid NOT NULL REFERENCES public.appraisals(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  offer_amount numeric,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appraisal_interests ENABLE ROW LEVEL SECURITY;

-- Customers can create interest on public appraisals
CREATE POLICY "Customers can submit interest on public appraisals"
ON public.appraisal_interests
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Customers can view their own interest submissions
CREATE POLICY "Customers can view their own interest"
ON public.appraisal_interests
FOR SELECT
USING (auth.uid() = customer_id);

-- Agents can view interest on their appraisals
CREATE POLICY "Agents can view interest on their appraisals"
ON public.appraisal_interests
FOR SELECT
USING (
  appraisal_id IN (
    SELECT id FROM public.appraisals 
    WHERE agent_id = get_agent_id(auth.uid())
  )
);

-- Agents can update interest status on their appraisals
CREATE POLICY "Agents can update interest on their appraisals"
ON public.appraisal_interests
FOR UPDATE
USING (
  appraisal_id IN (
    SELECT id FROM public.appraisals 
    WHERE agent_id = get_agent_id(auth.uid())
  )
);

-- Prototype policies for demo mode
CREATE POLICY "Prototype - view appraisal interests"
ON public.appraisal_interests
FOR SELECT
USING (appraisal_id IS NOT NULL);

CREATE POLICY "Prototype - insert appraisal interests"
ON public.appraisal_interests
FOR INSERT
WITH CHECK (appraisal_id IS NOT NULL);

CREATE POLICY "Prototype - update appraisal interests"
ON public.appraisal_interests
FOR UPDATE
USING (appraisal_id IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_appraisal_interests_updated_at
BEFORE UPDATE ON public.appraisal_interests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();