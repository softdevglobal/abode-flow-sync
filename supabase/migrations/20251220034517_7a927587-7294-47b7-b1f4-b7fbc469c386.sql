-- Add property detail columns to appraisals table
ALTER TABLE public.appraisals
ADD COLUMN IF NOT EXISTS property_type text DEFAULT 'house',
ADD COLUMN IF NOT EXISTS bedrooms integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bathrooms integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parking integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS land_size integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS headline text DEFAULT NULL;