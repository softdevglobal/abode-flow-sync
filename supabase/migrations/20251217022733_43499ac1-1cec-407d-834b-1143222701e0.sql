-- Create storage bucket for agent branding assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-assets', 'agent-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own agent assets
CREATE POLICY "Agents can upload their assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agent-assets' AND
  auth.uid() IS NOT NULL
);

-- Allow public read access to agent assets
CREATE POLICY "Public can view agent assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-assets');

-- Allow agents to update their own assets
CREATE POLICY "Agents can update their assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'agent-assets' AND auth.uid() IS NOT NULL);

-- Allow agents to delete their own assets
CREATE POLICY "Agents can delete their assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'agent-assets' AND auth.uid() IS NOT NULL);