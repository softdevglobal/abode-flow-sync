-- Add prototype policy for inserting inspections
CREATE POLICY "Prototype - insert inspections"
ON public.inspections
FOR INSERT
WITH CHECK (property_id IN (
  SELECT properties.id
  FROM properties
  WHERE properties.agent_id IS NOT NULL
));

-- Add prototype policy for updating inspections
CREATE POLICY "Prototype - update inspections"
ON public.inspections
FOR UPDATE
USING (property_id IN (
  SELECT properties.id
  FROM properties
  WHERE properties.agent_id IS NOT NULL
));

-- Add prototype policy for deleting inspections
CREATE POLICY "Prototype - delete inspections"
ON public.inspections
FOR DELETE
USING (property_id IN (
  SELECT properties.id
  FROM properties
  WHERE properties.agent_id IS NOT NULL
));

-- Add prototype policy for inserting inspection_bookings
CREATE POLICY "Prototype - insert inspection_bookings"
ON public.inspection_bookings
FOR INSERT
WITH CHECK (inspection_id IS NOT NULL);

-- Add prototype policy for updating inspection_bookings  
CREATE POLICY "Prototype - update inspection_bookings"
ON public.inspection_bookings
FOR UPDATE
USING (inspection_id IS NOT NULL);