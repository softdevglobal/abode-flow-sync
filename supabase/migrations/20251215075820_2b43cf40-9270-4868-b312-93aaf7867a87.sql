-- =============================================
-- 1. CREATE STORAGE BUCKET FOR PROPERTY IMAGES
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true);

-- Storage RLS Policies
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Agents can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND public.has_role(auth.uid(), 'agent')
);

CREATE POLICY "Agents can update property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND public.has_role(auth.uid(), 'agent')
);

CREATE POLICY "Agents can delete property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND public.has_role(auth.uid(), 'agent')
);

-- =============================================
-- 2. CREATE AUCTION STATUS ENUM
-- =============================================
CREATE TYPE public.auction_status AS ENUM ('pending', 'live', 'paused', 'sold', 'passed_in');

-- =============================================
-- 3. CREATE AUCTIONS TABLE
-- =============================================
CREATE TABLE public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL UNIQUE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  min_increment NUMERIC NOT NULL DEFAULT 1000,
  reserve_price NUMERIC,
  current_bid NUMERIC DEFAULT 0,
  status public.auction_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on auctions
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;

-- Auctions RLS Policies
CREATE POLICY "Public can view live and pending auctions"
ON public.auctions FOR SELECT
USING (status IN ('live', 'pending'));

CREATE POLICY "Agents can view all their auctions"
ON public.auctions FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE agent_id = public.get_agent_id(auth.uid())
  )
);

CREATE POLICY "Agents can create auctions for their properties"
ON public.auctions FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE agent_id = public.get_agent_id(auth.uid())
  )
  AND public.has_role(auth.uid(), 'agent')
);

CREATE POLICY "Agents can update their auctions"
ON public.auctions FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE agent_id = public.get_agent_id(auth.uid())
  )
  AND public.has_role(auth.uid(), 'agent')
);

CREATE POLICY "Agents can delete their auctions"
ON public.auctions FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE agent_id = public.get_agent_id(auth.uid())
  )
  AND public.has_role(auth.uid(), 'agent')
);

-- Trigger for updated_at on auctions
CREATE TRIGGER update_auctions_updated_at
BEFORE UPDATE ON public.auctions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 4. CREATE BIDS TABLE
-- =============================================
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on bids
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Bids RLS Policies
CREATE POLICY "Public can view bids on live auctions"
ON public.bids FOR SELECT
USING (
  auction_id IN (
    SELECT id FROM public.auctions WHERE status = 'live'
  )
);

CREATE POLICY "Users can view their own bid history"
ON public.bids FOR SELECT
USING (auth.uid() = bidder_id);

CREATE POLICY "Authenticated users can place bids on live auctions"
ON public.bids FOR INSERT
WITH CHECK (
  auth.uid() = bidder_id
  AND auction_id IN (
    SELECT id FROM public.auctions WHERE status = 'live'
  )
);

-- Agents can view all bids on their auctions
CREATE POLICY "Agents can view bids on their auctions"
ON public.bids FOR SELECT
USING (
  auction_id IN (
    SELECT a.id FROM public.auctions a
    JOIN public.properties p ON a.property_id = p.id
    WHERE p.agent_id = public.get_agent_id(auth.uid())
  )
);

-- =============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_auctions_property_id ON public.auctions(property_id);
CREATE INDEX idx_auctions_status ON public.auctions(status);
CREATE INDEX idx_auctions_start_time ON public.auctions(start_time);
CREATE INDEX idx_bids_auction_id ON public.bids(auction_id);
CREATE INDEX idx_bids_bidder_id ON public.bids(bidder_id);
CREATE INDEX idx_bids_amount ON public.bids(amount DESC);

-- =============================================
-- 6. ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspection_bookings;