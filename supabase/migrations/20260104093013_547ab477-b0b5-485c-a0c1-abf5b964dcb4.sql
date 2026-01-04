-- Add new customization columns to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS office_address text,
ADD COLUMN IF NOT EXISTS tagline text DEFAULT 'Find Your Dream Home',
ADD COLUMN IF NOT EXISTS hero_cta_text text DEFAULT 'Browse Properties',
ADD COLUMN IF NOT EXISTS social_facebook text,
ADD COLUMN IF NOT EXISTS social_instagram text,
ADD COLUMN IF NOT EXISTS social_linkedin text,
ADD COLUMN IF NOT EXISTS social_twitter text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS notification_email_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sound_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS splash_screen_url text,
ADD COLUMN IF NOT EXISTS app_icon_url text;