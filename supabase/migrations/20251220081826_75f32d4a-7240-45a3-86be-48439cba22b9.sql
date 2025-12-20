-- Ensure RLS is enabled
ALTER TABLE public.inspection_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Customers can view their own inspection bookings
DO $$
BEGIN
  CREATE POLICY "Customers can view their inspection bookings"
  ON public.inspection_bookings
  FOR SELECT
  USING (auth.uid() = customer_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Customers can view inspections they have booked
DO $$
BEGIN
  CREATE POLICY "Customers can view booked inspections"
  ON public.inspections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.inspection_bookings ib
      WHERE ib.inspection_id = inspections.id
        AND ib.customer_id = auth.uid()
        AND ib.status <> 'cancelled'
    )
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Agents can view inspections for their own properties
DO $$
BEGIN
  CREATE POLICY "Agents can view their inspections"
  ON public.inspections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.properties p
      WHERE p.id = inspections.property_id
        AND p.agent_id = public.get_agent_id(auth.uid())
    )
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Public/buyers can view active property records referenced by inspections (needed for nested selects)
-- NOTE: If you already have a stricter policy, this will no-op due to duplicate_object.
DO $$
BEGIN
  CREATE POLICY "Public can view active properties"
  ON public.properties
  FOR SELECT
  USING (status = 'active');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Buyers can view properties tied to their bookings even if not active
DO $$
BEGIN
  CREATE POLICY "Customers can view booked properties"
  ON public.properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.inspections i
      JOIN public.inspection_bookings ib ON ib.inspection_id = i.id
      WHERE i.property_id = properties.id
        AND ib.customer_id = auth.uid()
        AND ib.status <> 'cancelled'
    )
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;