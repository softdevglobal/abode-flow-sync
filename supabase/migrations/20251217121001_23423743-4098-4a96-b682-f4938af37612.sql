-- Create appraisal_requests table for buyer-submitted appraisal requests
CREATE TABLE public.appraisal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  address TEXT NOT NULL,
  suburb TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'NSW',
  postcode TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'house',
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking INTEGER,
  land_size NUMERIC,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appraisal_requests ENABLE ROW LEVEL SECURITY;

-- Customers can create their own requests
CREATE POLICY "Customers can create appraisal requests"
ON public.appraisal_requests
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Customers can view their own requests
CREATE POLICY "Customers can view their own requests"
ON public.appraisal_requests
FOR SELECT
USING (auth.uid() = customer_id);

-- Agents can view all requests (for lead generation)
CREATE POLICY "Agents can view appraisal requests"
ON public.appraisal_requests
FOR SELECT
USING (has_role(auth.uid(), 'agent'));

-- Agents can update request status
CREATE POLICY "Agents can update appraisal requests"
ON public.appraisal_requests
FOR UPDATE
USING (has_role(auth.uid(), 'agent'));

-- Add trigger for updated_at
CREATE TRIGGER update_appraisal_requests_updated_at
BEFORE UPDATE ON public.appraisal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();