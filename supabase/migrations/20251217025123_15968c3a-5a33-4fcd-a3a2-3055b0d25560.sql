-- Create partnership status enum
CREATE TYPE public.partnership_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create agent_partnerships table
CREATE TABLE public.agent_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  status partnership_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_partnership UNIQUE(requester_id, receiver_id),
  CONSTRAINT no_self_partnership CHECK (requester_id != receiver_id)
);

-- Add allow_partner_listings column to agents table
ALTER TABLE public.agents ADD COLUMN allow_partner_listings BOOLEAN NOT NULL DEFAULT true;

-- Enable RLS on agent_partnerships
ALTER TABLE public.agent_partnerships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_partnerships
-- Agents can view partnerships they're part of
CREATE POLICY "Agents can view their partnerships"
ON public.agent_partnerships FOR SELECT
USING (
  requester_id = get_agent_id(auth.uid()) OR 
  receiver_id = get_agent_id(auth.uid())
);

-- Agents can create partnership requests
CREATE POLICY "Agents can create partnership requests"
ON public.agent_partnerships FOR INSERT
WITH CHECK (requester_id = get_agent_id(auth.uid()));

-- Agents can update partnerships they received (accept/reject)
CREATE POLICY "Agents can update received partnerships"
ON public.agent_partnerships FOR UPDATE
USING (receiver_id = get_agent_id(auth.uid()));

-- Agents can delete partnerships they're part of
CREATE POLICY "Agents can delete their partnerships"
ON public.agent_partnerships FOR DELETE
USING (
  requester_id = get_agent_id(auth.uid()) OR 
  receiver_id = get_agent_id(auth.uid())
);

-- Prototype-friendly policies
CREATE POLICY "Prototype - view partnerships"
ON public.agent_partnerships FOR SELECT
USING (requester_id IS NOT NULL OR receiver_id IS NOT NULL);

CREATE POLICY "Prototype - create partnerships"
ON public.agent_partnerships FOR INSERT
WITH CHECK (requester_id IS NOT NULL);

CREATE POLICY "Prototype - update partnerships"
ON public.agent_partnerships FOR UPDATE
USING (receiver_id IS NOT NULL);

CREATE POLICY "Prototype - delete partnerships"
ON public.agent_partnerships FOR DELETE
USING (requester_id IS NOT NULL OR receiver_id IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_agent_partnerships_updated_at
BEFORE UPDATE ON public.agent_partnerships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for partnerships
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_partnerships;