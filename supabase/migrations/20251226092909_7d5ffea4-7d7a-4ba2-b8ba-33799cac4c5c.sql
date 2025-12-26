-- Create app_logs table for remote error monitoring
CREATE TABLE public.app_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id),
    user_id UUID,
    log_type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert logs for their organization (or anonymous logs)
CREATE POLICY "Users can insert logs" 
ON public.app_logs 
FOR INSERT 
WITH CHECK (true);

-- Policy: Only admins can view logs for their organization
CREATE POLICY "Admins can view org logs" 
ON public.app_logs 
FOR SELECT 
USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
);

-- Create index for faster querying
CREATE INDEX idx_app_logs_org_created ON public.app_logs(organization_id, created_at DESC);
CREATE INDEX idx_app_logs_type ON public.app_logs(log_type);

-- Create function to generate sequential MRN
CREATE OR REPLACE FUNCTION public.generate_mrn(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_year TEXT;
    patient_count INTEGER;
    new_mrn TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Count patients for this organization created in the current year
    SELECT COUNT(*) INTO patient_count
    FROM public.patients
    WHERE organization_id = org_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Generate MRN in format YYYY-XXXX
    new_mrn := current_year || '-' || LPAD((patient_count + 1)::TEXT, 4, '0');
    
    RETURN new_mrn;
END;
$$;