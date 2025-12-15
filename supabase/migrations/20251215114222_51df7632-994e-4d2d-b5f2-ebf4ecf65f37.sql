-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Customers can create bookings" ON inspection_bookings;

-- Create new permissive policy for prototype - allows any authenticated user to RSVP
CREATE POLICY "Authenticated users can create bookings" 
ON inspection_bookings FOR INSERT 
WITH CHECK (auth.uid() = customer_id);