-- Enable REPLICA IDENTITY FULL for better realtime change detection
ALTER TABLE public.buyer_messages REPLICA IDENTITY FULL;
ALTER TABLE public.inspection_bookings REPLICA IDENTITY FULL;