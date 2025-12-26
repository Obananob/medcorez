-- Drop the old constraint and add updated one with receptionist
ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'doctor'::text, 'nurse'::text, 'receptionist'::text, 'pharmacist'::text, 'accountant'::text]));