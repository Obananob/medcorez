-- Create prescriptions storage bucket for prescription images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prescriptions', 'prescriptions', false);

-- RLS policy: Only users in the same organization can upload prescription images
CREATE POLICY "Users can upload prescription images for their org"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'prescriptions' 
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- RLS policy: Users can view prescription images from their organization
CREATE POLICY "Users can view prescription images from their org"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'prescriptions' 
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- RLS policy: Users can delete prescription images from their organization
CREATE POLICY "Users can delete prescription images from their org"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'prescriptions' 
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- Add prescription_image_url column to prescriptions table
ALTER TABLE public.prescriptions
ADD COLUMN prescription_image_url TEXT;

-- Add chronic_conditions column to patients table for pinned health conditions
ALTER TABLE public.patients
ADD COLUMN chronic_conditions TEXT;