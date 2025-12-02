-- Add currency and organization details columns
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS currency_symbol text DEFAULT '$',
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS support_email text,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- Add dispense_status to prescriptions for pharmacy tracking
ALTER TABLE public.prescriptions 
ADD COLUMN IF NOT EXISTS dispense_status text DEFAULT 'pending';

-- Add consultation_fee to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS consultation_fee numeric DEFAULT 0;