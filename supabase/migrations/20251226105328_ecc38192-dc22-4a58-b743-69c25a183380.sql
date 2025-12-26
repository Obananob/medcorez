-- Add lab_scientist to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lab_scientist';

-- Create lab_requests table for Lab module
CREATE TABLE public.lab_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    requesting_doctor_id UUID,
    test_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'pending',
    sample_collected_at TIMESTAMP WITH TIME ZONE,
    collected_by UUID,
    findings TEXT,
    reference_range TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'collected', 'completed', 'cancelled'))
);

-- Enable RLS on lab_requests
ALTER TABLE public.lab_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lab_requests
CREATE POLICY "Users can view lab requests in their org"
ON public.lab_requests
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create lab requests in their org"
ON public.lab_requests
FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update lab requests in their org"
ON public.lab_requests
FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete lab requests in their org"
ON public.lab_requests
FOR DELETE
USING (organization_id = get_user_organization_id(auth.uid()));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_lab_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_lab_requests_updated_at
BEFORE UPDATE ON public.lab_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_lab_requests_updated_at();

-- Add index for common queries
CREATE INDEX idx_lab_requests_organization_id ON public.lab_requests(organization_id);
CREATE INDEX idx_lab_requests_status ON public.lab_requests(status);
CREATE INDEX idx_lab_requests_patient_id ON public.lab_requests(patient_id);