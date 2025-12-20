-- Add images column to appraisals table
ALTER TABLE public.appraisals
ADD COLUMN images text[] DEFAULT '{}'::text[];

-- Create storage bucket for appraisal images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('appraisal-images', 'appraisal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload appraisal images
CREATE POLICY "Authenticated users can upload appraisal images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'appraisal-images');

-- Allow public read access to appraisal images
CREATE POLICY "Public can view appraisal images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'appraisal-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their appraisal images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'appraisal-images');