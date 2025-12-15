-- Prototype adjustment: relax foreign key constraint on bids.bidder_id
-- Bids already enforce validity via RLS and auction status; for manual in-room bidders
-- we don't always have a corresponding auth user record.

ALTER TABLE public.bids
  DROP CONSTRAINT IF EXISTS bids_bidder_id_fkey;