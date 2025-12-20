-- Create buyer_messages table for all buyer communications
CREATE TABLE public.buyer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  
  category TEXT NOT NULL CHECK (category IN ('newsletter', 'auction', 'pre_market', 'inspection', 'message')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Related entities (optional)
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  appraisal_id UUID REFERENCES public.appraisals(id) ON DELETE SET NULL,
  auction_id UUID REFERENCES public.auctions(id) ON DELETE SET NULL,
  
  -- Metadata
  read BOOLEAN NOT NULL DEFAULT false,
  starred BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buyer_messages ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own messages
CREATE POLICY "Buyers can view their messages"
  ON public.buyer_messages
  FOR SELECT
  USING (auth.uid() = buyer_id);

-- Buyers can update their own messages (mark read/starred)
CREATE POLICY "Buyers can update their messages"
  ON public.buyer_messages
  FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Agents can insert messages to buyers
CREATE POLICY "Agents can send messages to buyers"
  ON public.buyer_messages
  FOR INSERT
  WITH CHECK (agent_id = get_agent_id(auth.uid()));

-- Prototype policy for testing
CREATE POLICY "Prototype - insert buyer messages"
  ON public.buyer_messages
  FOR INSERT
  WITH CHECK (agent_id IS NOT NULL);

CREATE POLICY "Prototype - view buyer messages"
  ON public.buyer_messages
  FOR SELECT
  USING (buyer_id IS NOT NULL);

CREATE POLICY "Prototype - update buyer messages"
  ON public.buyer_messages
  FOR UPDATE
  USING (buyer_id IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_buyer_messages_buyer_id ON public.buyer_messages(buyer_id);
CREATE INDEX idx_buyer_messages_category ON public.buyer_messages(category);
CREATE INDEX idx_buyer_messages_read ON public.buyer_messages(read);
CREATE INDEX idx_buyer_messages_created_at ON public.buyer_messages(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_buyer_messages_updated_at
  BEFORE UPDATE ON public.buyer_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for buyer_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.buyer_messages;