-- Function to create notification when inspection is booked
CREATE OR REPLACE FUNCTION public.notify_inspection_booking()
RETURNS TRIGGER AS $$
DECLARE
  _agent_user_id uuid;
  _property_title text;
  _customer_name text;
BEGIN
  -- Get the agent's user_id for the property associated with this inspection
  SELECT a.user_id, p.title INTO _agent_user_id, _property_title
  FROM inspections i
  JOIN properties p ON i.property_id = p.id
  JOIN agents a ON p.agent_id = a.id
  WHERE i.id = NEW.inspection_id;
  
  -- Get customer name
  SELECT COALESCE(first_name || ' ' || last_name, email) INTO _customer_name
  FROM profiles
  WHERE id = NEW.customer_id;
  
  -- Insert notification for the agent
  IF _agent_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      _agent_user_id,
      'inspection_reminder',
      'New Inspection Booking',
      COALESCE(_customer_name, 'A customer') || ' has booked an inspection for ' || COALESCE(_property_title, 'a property'),
      jsonb_build_object('inspection_id', NEW.inspection_id, 'customer_id', NEW.customer_id, 'booking_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create notification when viewing request is submitted
CREATE OR REPLACE FUNCTION public.notify_viewing_request()
RETURNS TRIGGER AS $$
DECLARE
  _agent_user_id uuid;
  _property_title text;
  _customer_name text;
BEGIN
  -- Get the agent's user_id and property title
  SELECT a.user_id, p.title INTO _agent_user_id, _property_title
  FROM properties p
  JOIN agents a ON p.agent_id = a.id
  WHERE p.id = NEW.property_id;
  
  -- Get customer name
  SELECT COALESCE(first_name || ' ' || last_name, email) INTO _customer_name
  FROM profiles
  WHERE id = NEW.customer_id;
  
  -- Insert notification for the agent
  IF _agent_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      _agent_user_id,
      'viewing_request',
      'New Viewing Request',
      COALESCE(_customer_name, 'A customer') || ' has requested a viewing for ' || COALESCE(_property_title, 'a property'),
      jsonb_build_object('viewing_request_id', NEW.id, 'property_id', NEW.property_id, 'customer_id', NEW.customer_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create notification when bid is placed
CREATE OR REPLACE FUNCTION public.notify_auction_bid()
RETURNS TRIGGER AS $$
DECLARE
  _agent_user_id uuid;
  _property_title text;
BEGIN
  -- Get the agent's user_id and property title
  SELECT a.user_id, p.title INTO _agent_user_id, _property_title
  FROM auctions au
  JOIN properties p ON au.property_id = p.id
  JOIN agents a ON p.agent_id = a.id
  WHERE au.id = NEW.auction_id;
  
  -- Insert notification for the agent
  IF _agent_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      _agent_user_id,
      'status_update',
      'New Bid Placed',
      'A bid of $' || TO_CHAR(NEW.amount, 'FM999,999,999') || ' was placed on ' || COALESCE(_property_title, 'a property'),
      jsonb_build_object('auction_id', NEW.auction_id, 'bid_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS on_inspection_booking_created ON inspection_bookings;
CREATE TRIGGER on_inspection_booking_created
  AFTER INSERT ON inspection_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_inspection_booking();

DROP TRIGGER IF EXISTS on_viewing_request_created ON viewing_requests;
CREATE TRIGGER on_viewing_request_created
  AFTER INSERT ON viewing_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_viewing_request();

DROP TRIGGER IF EXISTS on_bid_placed ON bids;
CREATE TRIGGER on_bid_placed
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_auction_bid();