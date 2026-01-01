-- Add plan column to organizations table (freemium by default)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'freemium'
CHECK (plan IN ('freemium', 'premium'));