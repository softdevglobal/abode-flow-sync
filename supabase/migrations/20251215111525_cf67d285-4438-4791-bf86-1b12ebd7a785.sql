-- Create viewing request status enum
CREATE TYPE public.viewing_request_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'counter_proposed',
  'confirmed',
  'cancelled'
);

-- Create viewing_requests table
CREATE TABLE public.viewing_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  requested_time TEXT NOT NULL,
  message TEXT,
  status viewing_request_status NOT NULL DEFAULT 'pending',
  proposed_date DATE,
  proposed_time TEXT,
  agent_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.viewing_requests ENABLE ROW LEVEL SECURITY;

-- Customers can create viewing requests
CREATE POLICY "Customers can create viewing requests"
ON public.viewing_requests
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Customers can view their own viewing requests
CREATE POLICY "Customers can view their own viewing requests"
ON public.viewing_requests
FOR SELECT
USING (auth.uid() = customer_id);

-- Customers can update their own viewing requests (to confirm/cancel)
CREATE POLICY "Customers can update their own viewing requests"
ON public.viewing_requests
FOR UPDATE
USING (auth.uid() = customer_id);

-- Agents can view viewing requests for their properties
CREATE POLICY "Agents can view viewing requests for their properties"
ON public.viewing_requests
FOR SELECT
USING (agent_id = get_agent_id(auth.uid()));

-- Agents can update viewing requests for their properties
CREATE POLICY "Agents can update viewing requests for their properties"
ON public.viewing_requests
FOR UPDATE
USING (agent_id = get_agent_id(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_viewing_requests_updated_at
BEFORE UPDATE ON public.viewing_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_viewing_requests_customer ON public.viewing_requests(customer_id);
CREATE INDEX idx_viewing_requests_agent ON public.viewing_requests(agent_id);
CREATE INDEX idx_viewing_requests_property ON public.viewing_requests(property_id);