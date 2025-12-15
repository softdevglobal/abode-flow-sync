-- Create enum for note types
CREATE TYPE public.crm_note_type AS ENUM ('call', 'email', 'meeting', 'follow_up', 'general');

-- Create CRM notes table for agent notes about customers
CREATE TABLE public.crm_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_type crm_note_type NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

-- Agents can view notes for their customers
CREATE POLICY "Agents can view their CRM notes"
ON public.crm_notes
FOR SELECT
USING (agent_id = get_agent_id(auth.uid()));

-- Agents can create notes
CREATE POLICY "Agents can create CRM notes"
ON public.crm_notes
FOR INSERT
WITH CHECK (agent_id = get_agent_id(auth.uid()) AND has_role(auth.uid(), 'agent'::app_role));

-- Agents can update their notes
CREATE POLICY "Agents can update their CRM notes"
ON public.crm_notes
FOR UPDATE
USING (agent_id = get_agent_id(auth.uid()));

-- Agents can delete their notes
CREATE POLICY "Agents can delete their CRM notes"
ON public.crm_notes
FOR DELETE
USING (agent_id = get_agent_id(auth.uid()));

-- Prototype policies (for demo mode without auth)
CREATE POLICY "Prototype - view CRM notes"
ON public.crm_notes
FOR SELECT
USING (agent_id IS NOT NULL);

CREATE POLICY "Prototype - insert CRM notes"
ON public.crm_notes
FOR INSERT
WITH CHECK (agent_id IS NOT NULL);

CREATE POLICY "Prototype - update CRM notes"
ON public.crm_notes
FOR UPDATE
USING (agent_id IS NOT NULL);

CREATE POLICY "Prototype - delete CRM notes"
ON public.crm_notes
FOR DELETE
USING (agent_id IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_crm_notes_updated_at
BEFORE UPDATE ON public.crm_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policy for agents to view customer profiles they've interacted with
CREATE POLICY "Agents can view customer profiles"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT customer_id FROM public.inspection_bookings ib
    JOIN public.inspections i ON ib.inspection_id = i.id
    JOIN public.properties p ON i.property_id = p.id
    WHERE p.agent_id = get_agent_id(auth.uid())
  )
  OR id IN (
    SELECT DISTINCT customer_id FROM public.viewing_requests
    WHERE agent_id = get_agent_id(auth.uid())
  )
  OR id IN (
    SELECT DISTINCT b.bidder_id FROM public.bids b
    JOIN public.auctions a ON b.auction_id = a.id
    JOIN public.properties p ON a.property_id = p.id
    WHERE p.agent_id = get_agent_id(auth.uid())
  )
);