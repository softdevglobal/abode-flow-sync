-- Add theme customization columns to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS theme_agency_name text,
ADD COLUMN IF NOT EXISTS theme_primary_color text DEFAULT '220 50% 20%',
ADD COLUMN IF NOT EXISTS theme_secondary_color text DEFAULT '220 30% 96%',
ADD COLUMN IF NOT EXISTS theme_accent_color text DEFAULT '25 95% 53%',
ADD COLUMN IF NOT EXISTS theme_logo_url text,
ADD COLUMN IF NOT EXISTS theme_favicon_url text;