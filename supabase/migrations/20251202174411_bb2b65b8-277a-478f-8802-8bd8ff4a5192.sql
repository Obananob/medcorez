-- Create prescriptions table for storing medicines prescribed during consultations
CREATE TABLE public.prescriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL,
    medicine_name text NOT NULL,
    dosage text,
    frequency text,
    duration text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view prescriptions in their org"
ON public.prescriptions
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create prescriptions in their org"
ON public.prescriptions
FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update prescriptions in their org"
ON public.prescriptions
FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete prescriptions in their org"
ON public.prescriptions
FOR DELETE
USING (organization_id = get_user_organization_id(auth.uid()));