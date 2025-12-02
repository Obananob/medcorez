-- Add logo_url column to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos for their organization
CREATE POLICY "Users can upload org logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'organization-logos' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to logos
CREATE POLICY "Public can view org logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'organization-logos');

-- Allow users to update/delete their org logos
CREATE POLICY "Users can update org logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'organization-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete org logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'organization-logos' AND auth.role() = 'authenticated');