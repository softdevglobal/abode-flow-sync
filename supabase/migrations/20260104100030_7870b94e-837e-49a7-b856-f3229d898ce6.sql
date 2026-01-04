-- Add button and icon color customization columns
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS theme_button_color text DEFAULT '20 90% 48%',
ADD COLUMN IF NOT EXISTS theme_button_text_color text DEFAULT '0 0% 100%',
ADD COLUMN IF NOT EXISTS theme_icon_color text DEFAULT '20 90% 48%',
ADD COLUMN IF NOT EXISTS theme_link_color text DEFAULT '20 90% 48%';