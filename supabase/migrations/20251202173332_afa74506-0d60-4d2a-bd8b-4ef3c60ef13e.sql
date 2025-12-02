-- Add email column to profiles table for staff management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create RLS policy to allow users to insert profiles in their organization
CREATE POLICY "Users can insert profiles in their org"
ON public.profiles
FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));