-- Create role enum
CREATE TYPE public.app_role AS ENUM ('agent', 'customer');

-- Create property type enum
CREATE TYPE public.property_type AS ENUM ('house', 'apartment', 'townhouse', 'land', 'commercial', 'rural');

-- Create property status enum
CREATE TYPE public.property_status AS ENUM ('active', 'sold', 'pending', 'off_market');

-- Create listing type enum
CREATE TYPE public.listing_type AS ENUM ('sale', 'rent');

-- Create inspection status enum
CREATE TYPE public.inspection_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'attended', 'no_show');

-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM ('viewing_request', 'inspection_reminder', 'new_listing', 'status_update', 'message');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  agency_name TEXT,
  license_number TEXT,
  bio TEXT,
  profile_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  price_from NUMERIC,
  price_to NUMERIC,
  price_display TEXT,
  address TEXT NOT NULL,
  suburb TEXT NOT NULL,
  state TEXT NOT NULL,
  postcode TEXT NOT NULL,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  parking INTEGER DEFAULT 0,
  land_size NUMERIC,
  building_size NUMERIC,
  property_type property_type NOT NULL,
  listing_type listing_type NOT NULL DEFAULT 'sale',
  status property_status NOT NULL DEFAULT 'active',
  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create inspections table
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  max_attendees INTEGER DEFAULT 20,
  current_attendees INTEGER DEFAULT 0,
  status inspection_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create inspection_bookings table
CREATE TABLE public.inspection_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspection_id, customer_id)
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, property_id)
);

-- Create saved_searches table
CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  search_criteria JSONB NOT NULL DEFAULT '{}',
  alerts_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's agent_id
CREATE OR REPLACE FUNCTION public.get_agent_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.agents WHERE user_id = _user_id
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies (users can view their own roles)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Agents policies
CREATE POLICY "Public can view agents"
  ON public.agents FOR SELECT
  USING (true);

CREATE POLICY "Agents can update their own profile"
  ON public.agents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Agents can insert their own profile"
  ON public.agents FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'agent'));

-- Properties policies
CREATE POLICY "Public can view active properties"
  ON public.properties FOR SELECT
  USING (status = 'active' OR status = 'pending');

CREATE POLICY "Agents can view all their properties"
  ON public.properties FOR SELECT
  USING (agent_id = public.get_agent_id(auth.uid()));

CREATE POLICY "Agents can insert properties"
  ON public.properties FOR INSERT
  WITH CHECK (agent_id = public.get_agent_id(auth.uid()) AND public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can update their properties"
  ON public.properties FOR UPDATE
  USING (agent_id = public.get_agent_id(auth.uid()) AND public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can delete their properties"
  ON public.properties FOR DELETE
  USING (agent_id = public.get_agent_id(auth.uid()) AND public.has_role(auth.uid(), 'agent'));

-- Inspections policies
CREATE POLICY "Public can view scheduled inspections"
  ON public.inspections FOR SELECT
  USING (status = 'scheduled');

CREATE POLICY "Agents can manage inspections for their properties"
  ON public.inspections FOR ALL
  USING (property_id IN (SELECT id FROM public.properties WHERE agent_id = public.get_agent_id(auth.uid())));

-- Inspection bookings policies
CREATE POLICY "Customers can view their bookings"
  ON public.inspection_bookings FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Agents can view bookings for their inspections"
  ON public.inspection_bookings FOR SELECT
  USING (inspection_id IN (
    SELECT i.id FROM public.inspections i
    JOIN public.properties p ON i.property_id = p.id
    WHERE p.agent_id = public.get_agent_id(auth.uid())
  ));

CREATE POLICY "Customers can create bookings"
  ON public.inspection_bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id AND public.has_role(auth.uid(), 'customer'));

CREATE POLICY "Customers can update their bookings"
  ON public.inspection_bookings FOR UPDATE
  USING (auth.uid() = customer_id);

-- Favorites policies
CREATE POLICY "Customers can manage their favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = customer_id);

-- Saved searches policies
CREATE POLICY "Customers can manage their saved searches"
  ON public.saved_searches FOR ALL
  USING (auth.uid() = customer_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Get role from metadata (default to customer)
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'customer');
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  -- If agent, create agent record
  IF _role = 'agent' THEN
    INSERT INTO public.agents (user_id, agency_name, license_number)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'agency_name',
      NEW.raw_user_meta_data ->> 'license_number'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_properties_agent_id ON public.properties(agent_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_suburb ON public.properties(suburb);
CREATE INDEX idx_properties_property_type ON public.properties(property_type);
CREATE INDEX idx_inspections_property_id ON public.inspections(property_id);
CREATE INDEX idx_inspections_date_time ON public.inspections(date_time);
CREATE INDEX idx_inspection_bookings_customer_id ON public.inspection_bookings(customer_id);
CREATE INDEX idx_favorites_customer_id ON public.favorites(customer_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);