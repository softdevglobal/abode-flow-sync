-- Create appraisals table
CREATE TABLE public.appraisals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
    address text NOT NULL,
    suburb text NOT NULL,
    state text NOT NULL DEFAULT 'NSW',
    postcode text NOT NULL,
    price_from numeric NOT NULL,
    price_to numeric NOT NULL,
    confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
    notes text,
    is_public boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appraisals ENABLE ROW LEVEL SECURITY;

-- Agents can manage their own appraisals
CREATE POLICY "Agents can manage their appraisals"
ON public.appraisals
FOR ALL
USING (agent_id = get_agent_id(auth.uid()))
WITH CHECK (agent_id = get_agent_id(auth.uid()));

-- Prototype policy for agent access
CREATE POLICY "Prototype - agents can manage appraisals"
ON public.appraisals
FOR ALL
USING (agent_id IS NOT NULL)
WITH CHECK (agent_id IS NOT NULL);

-- Public can view public appraisals
CREATE POLICY "Public can view public appraisals"
ON public.appraisals
FOR SELECT
USING (is_public = true);

-- Add updated_at trigger
CREATE TRIGGER update_appraisals_updated_at
BEFORE UPDATE ON public.appraisals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();