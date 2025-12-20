-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;

-- Add prototype policies for viewing notifications
-- In production, this should be auth.uid() = user_id, but for prototyping we allow all authenticated users
CREATE POLICY "Prototype - view notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Add prototype policy for updating notifications
CREATE POLICY "Prototype - update notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add prototype policy for inserting notifications (for triggers)
CREATE POLICY "Prototype - insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);