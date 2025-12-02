-- Add emergency_contact column to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact text;