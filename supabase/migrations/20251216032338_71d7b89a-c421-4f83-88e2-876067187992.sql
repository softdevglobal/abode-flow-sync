-- Function to notify customer when viewing request status changes
CREATE OR REPLACE FUNCTION public.notify_viewing_request_status_change()
RETURNS TRIGGER AS $$
DECLARE
  _property_title text;
  _notification_title text;
  _notification_message text;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get property title
  SELECT title INTO _property_title
  FROM properties
  WHERE id = NEW.property_id;
  
  -- Set notification based on new status
  CASE NEW.status
    WHEN 'accepted' THEN
      _notification_title := 'Viewing Request Accepted';
      _notification_message := 'Your viewing request for ' || COALESCE(_property_title, 'a property') || ' has been accepted!';
    WHEN 'declined' THEN
      _notification_title := 'Viewing Request Declined';
      _notification_message := 'Unfortunately, your viewing request for ' || COALESCE(_property_title, 'a property') || ' has been declined.';
    WHEN 'counter_proposed' THEN
      _notification_title := 'New Time Proposed';
      _notification_message := 'The agent has proposed a new time for your viewing of ' || COALESCE(_property_title, 'a property') || '. Please review.';
    WHEN 'confirmed' THEN
      _notification_title := 'Viewing Confirmed';
      _notification_message := 'Your viewing for ' || COALESCE(_property_title, 'a property') || ' is confirmed!';
    WHEN 'cancelled' THEN
      _notification_title := 'Viewing Cancelled';
      _notification_message := 'Your viewing request for ' || COALESCE(_property_title, 'a property') || ' has been cancelled.';
    ELSE
      RETURN NEW;
  END CASE;
  
  -- Insert notification for the customer
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.customer_id,
    'viewing_request',
    _notification_title,
    _notification_message,
    jsonb_build_object('viewing_request_id', NEW.id, 'property_id', NEW.property_id, 'status', NEW.status)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify customer when their inspection booking is confirmed
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  _property_title text;
  _inspection_date timestamp with time zone;
  _notification_title text;
  _notification_message text;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get property and inspection details
  SELECT p.title, i.date_time INTO _property_title, _inspection_date
  FROM inspections i
  JOIN properties p ON i.property_id = p.id
  WHERE i.id = NEW.inspection_id;
  
  -- Set notification based on new status
  CASE NEW.status
    WHEN 'confirmed' THEN
      _notification_title := 'Inspection Booking Confirmed';
      _notification_message := 'Your inspection booking for ' || COALESCE(_property_title, 'a property') || ' on ' || TO_CHAR(_inspection_date, 'DD Mon YYYY at HH:MI AM') || ' is confirmed!';
    WHEN 'cancelled' THEN
      _notification_title := 'Inspection Booking Cancelled';
      _notification_message := 'Your inspection booking for ' || COALESCE(_property_title, 'a property') || ' has been cancelled.';
    ELSE
      RETURN NEW;
  END CASE;
  
  -- Insert notification for the customer
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.customer_id,
    'inspection_reminder',
    _notification_title,
    _notification_message,
    jsonb_build_object('inspection_id', NEW.inspection_id, 'booking_id', NEW.id, 'status', NEW.status)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to send inspection reminder (called via cron)
CREATE OR REPLACE FUNCTION public.send_inspection_reminders()
RETURNS void AS $$
DECLARE
  _booking RECORD;
  _property_title text;
BEGIN
  -- Find all confirmed bookings for inspections happening in the next 24 hours
  -- that haven't been reminded yet (we'll use the notes field to track this)
  FOR _booking IN
    SELECT ib.id, ib.customer_id, ib.inspection_id, i.date_time, p.title as property_title
    FROM inspection_bookings ib
    JOIN inspections i ON ib.inspection_id = i.id
    JOIN properties p ON i.property_id = p.id
    WHERE ib.status IN ('pending', 'confirmed')
      AND i.status = 'scheduled'
      AND i.date_time > NOW()
      AND i.date_time <= NOW() + INTERVAL '24 hours'
      AND (ib.notes IS NULL OR ib.notes NOT LIKE '%REMINDED%')
  LOOP
    -- Insert reminder notification
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      _booking.customer_id,
      'inspection_reminder',
      'Inspection Reminder',
      'Reminder: You have an inspection for ' || COALESCE(_booking.property_title, 'a property') || ' tomorrow at ' || TO_CHAR(_booking.date_time, 'HH:MI AM'),
      jsonb_build_object('inspection_id', _booking.inspection_id, 'booking_id', _booking.id)
    );
    
    -- Mark as reminded
    UPDATE inspection_bookings
    SET notes = COALESCE(notes, '') || ' REMINDED'
    WHERE id = _booking.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS on_viewing_request_status_change ON viewing_requests;
CREATE TRIGGER on_viewing_request_status_change
  AFTER UPDATE ON viewing_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_viewing_request_status_change();

DROP TRIGGER IF EXISTS on_booking_status_change ON inspection_bookings;
CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON inspection_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_status_change();