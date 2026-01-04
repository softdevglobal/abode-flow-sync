-- Add typography customization columns to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS theme_heading_font text DEFAULT 'Manrope',
ADD COLUMN IF NOT EXISTS theme_body_font text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS theme_base_font_size text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS theme_heading_scale text DEFAULT 'standard';