-- Add user_id column to staff table to link staff to auth users
ALTER TABLE public.staff ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_staff_user_id ON public.staff(user_id);