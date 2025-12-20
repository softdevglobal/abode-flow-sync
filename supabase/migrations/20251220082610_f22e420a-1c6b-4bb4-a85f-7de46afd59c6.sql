-- Create SECURITY DEFINER helper function to get inspection IDs a customer has booked
CREATE OR REPLACE FUNCTION public.get_customer_booked_inspection_ids(_customer_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT inspection_id 
  FROM inspection_bookings 
  WHERE customer_id = _customer_id 
    AND status <> 'cancelled'
$$;

-- Create SECURITY DEFINER helper function to get property IDs a customer has booked
CREATE OR REPLACE FUNCTION public.get_customer_booked_property_ids(_customer_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT i.property_id
  FROM inspection_bookings ib
  JOIN inspections i ON i.id = ib.inspection_id
  WHERE ib.customer_id = _customer_id
    AND ib.status <> 'cancelled'
$$;

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Customers can view booked inspections" ON public.inspections;
DROP POLICY IF EXISTS "Customers can view booked properties" ON public.properties;

-- Recreate policies using the helper functions (no recursion)
CREATE POLICY "Customers can view booked inspections"
ON public.inspections
FOR SELECT
USING (id IN (SELECT get_customer_booked_inspection_ids(auth.uid())));

CREATE POLICY "Customers can view booked properties"
ON public.properties
FOR SELECT
USING (id IN (SELECT get_customer_booked_property_ids(auth.uid())));