-- Add 'appraisal_interest' to notification_type enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'appraisal_interest' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'appraisal_interest';
  END IF;
END$$;

-- Create trigger function to notify agent when buyer expresses interest
CREATE OR REPLACE FUNCTION public.notify_appraisal_interest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _agent_user_id uuid;
  _appraisal_address text;
  _customer_name text;
BEGIN
  -- Get the agent's user_id and appraisal address
  SELECT a.user_id, ap.address INTO _agent_user_id, _appraisal_address
  FROM appraisals ap
  JOIN agents a ON ap.agent_id = a.id
  WHERE ap.id = NEW.appraisal_id;
  
  -- Get customer name
  SELECT COALESCE(first_name || ' ' || last_name, email) INTO _customer_name
  FROM profiles
  WHERE id = NEW.customer_id;
  
  -- Insert notification for the agent
  IF _agent_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      _agent_user_id,
      'appraisal_interest',
      'New Expression of Interest!',
      COALESCE(_customer_name, 'A buyer') || ' is interested in ' || COALESCE(_appraisal_address, 'a pre-market property'),
      jsonb_build_object(
        'appraisal_id', NEW.appraisal_id, 
        'interest_id', NEW.id, 
        'customer_id', NEW.customer_id, 
        'offer_amount', NEW.offer_amount
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on appraisal_interests table
DROP TRIGGER IF EXISTS on_appraisal_interest_created ON appraisal_interests;
CREATE TRIGGER on_appraisal_interest_created
  AFTER INSERT ON appraisal_interests
  FOR EACH ROW
  EXECUTE FUNCTION notify_appraisal_interest();