
-- Create inspection_invitations table
CREATE TABLE public.inspection_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_interest_id UUID REFERENCES public.appraisal_interests(id) ON DELETE CASCADE NOT NULL,
  appraisal_id UUID REFERENCES public.appraisals(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID NOT NULL,
  
  -- Agent proposes these time slots
  proposed_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  agent_message TEXT,
  
  -- Buyer's selection
  selected_date DATE,
  selected_time TEXT,
  buyer_message TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inspection_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agents can manage their invitations"
ON public.inspection_invitations
FOR ALL
USING (agent_id = get_agent_id(auth.uid()))
WITH CHECK (agent_id = get_agent_id(auth.uid()));

CREATE POLICY "Customers can view their invitations"
ON public.inspection_invitations
FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can update their invitations"
ON public.inspection_invitations
FOR UPDATE
USING (auth.uid() = customer_id);

-- Prototype policies for demo mode
CREATE POLICY "Prototype - manage inspection invitations"
ON public.inspection_invitations
FOR ALL
USING (agent_id IS NOT NULL)
WITH CHECK (agent_id IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_inspection_invitations_updated_at
BEFORE UPDATE ON public.inspection_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to notify buyer when agent sends invitation
CREATE OR REPLACE FUNCTION public.notify_inspection_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _appraisal_address text;
BEGIN
  -- Get appraisal address
  SELECT address INTO _appraisal_address
  FROM appraisals
  WHERE id = NEW.appraisal_id;
  
  -- Insert notification for the customer
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.customer_id,
    'inspection_reminder',
    'Inspection Invitation!',
    'You have been invited to inspect ' || COALESCE(_appraisal_address, 'a property') || '. Please select a time.',
    jsonb_build_object(
      'invitation_id', NEW.id,
      'appraisal_id', NEW.appraisal_id,
      'appraisal_interest_id', NEW.appraisal_interest_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger: notify buyer when invitation is created
CREATE TRIGGER on_inspection_invitation_created
AFTER INSERT ON public.inspection_invitations
FOR EACH ROW
EXECUTE FUNCTION public.notify_inspection_invitation();

-- Function to notify agent when buyer confirms time
CREATE OR REPLACE FUNCTION public.notify_inspection_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agent_user_id uuid;
  _appraisal_address text;
  _customer_name text;
BEGIN
  -- Only trigger when status changes to confirmed
  IF OLD.status = NEW.status OR NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;
  
  -- Get agent user_id and appraisal address
  SELECT a.user_id, ap.address INTO _agent_user_id, _appraisal_address
  FROM agents a
  JOIN appraisals ap ON ap.agent_id = a.id
  WHERE a.id = NEW.agent_id AND ap.id = NEW.appraisal_id;
  
  -- Get customer name
  SELECT COALESCE(first_name || ' ' || last_name, email) INTO _customer_name
  FROM profiles
  WHERE id = NEW.customer_id;
  
  -- Insert notification for the agent (this will trigger doorbell sound)
  IF _agent_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      _agent_user_id,
      'appraisal_interest',
      'Inspection Confirmed!',
      COALESCE(_customer_name, 'A buyer') || ' confirmed inspection for ' || COALESCE(_appraisal_address, 'a property') || ' on ' || NEW.selected_date || ' at ' || NEW.selected_time,
      jsonb_build_object(
        'invitation_id', NEW.id,
        'appraisal_id', NEW.appraisal_id,
        'customer_id', NEW.customer_id,
        'selected_date', NEW.selected_date,
        'selected_time', NEW.selected_time
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: notify agent when buyer confirms
CREATE TRIGGER on_inspection_confirmed
AFTER UPDATE ON public.inspection_invitations
FOR EACH ROW
EXECUTE FUNCTION public.notify_inspection_confirmed();

-- Enable realtime for inspection_invitations
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspection_invitations;
