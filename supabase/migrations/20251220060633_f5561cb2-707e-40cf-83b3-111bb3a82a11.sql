-- Create auction_registrations table for bidder registration
CREATE TABLE public.auction_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(auction_id, user_id)
);

-- Enable RLS
ALTER TABLE public.auction_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view their own registrations"
ON public.auction_registrations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can register for auctions
CREATE POLICY "Users can register for auctions"
ON public.auction_registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Agents can view registrations for their auctions
CREATE POLICY "Agents can view registrations for their auctions"
ON public.auction_registrations
FOR SELECT
USING (auction_id IN (
  SELECT a.id FROM auctions a
  JOIN properties p ON a.property_id = p.id
  WHERE p.agent_id = get_agent_id(auth.uid())
));

-- Agents can update registrations for their auctions
CREATE POLICY "Agents can update registrations for their auctions"
ON public.auction_registrations
FOR UPDATE
USING (auction_id IN (
  SELECT a.id FROM auctions a
  JOIN properties p ON a.property_id = p.id
  WHERE p.agent_id = get_agent_id(auth.uid())
));

-- Prototype policies for development
CREATE POLICY "Prototype - view registrations"
ON public.auction_registrations
FOR SELECT
USING (auction_id IS NOT NULL);

CREATE POLICY "Prototype - insert registrations"
ON public.auction_registrations
FOR INSERT
WITH CHECK (auction_id IS NOT NULL);

CREATE POLICY "Prototype - update registrations"
ON public.auction_registrations
FOR UPDATE
USING (auction_id IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_auction_registrations_updated_at
BEFORE UPDATE ON public.auction_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();