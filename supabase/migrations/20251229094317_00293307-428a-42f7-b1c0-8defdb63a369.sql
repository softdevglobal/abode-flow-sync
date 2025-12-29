-- Add hero image column to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS theme_hero_image_url text;