-- Create ANC enrollments table
CREATE TABLE public.anc_enrollments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    lmp DATE NOT NULL,
    edd DATE NOT NULL,
    gravida INTEGER NOT NULL DEFAULT 1,
    para INTEGER NOT NULL DEFAULT 0,
    blood_group TEXT,
    genotype TEXT,
    hiv_status TEXT,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(patient_id, lmp)
);

-- Create ANC visits table
CREATE TABLE public.anc_visits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES public.anc_enrollments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    gestational_age_weeks INTEGER,
    gestational_age_days INTEGER,
    fundal_height_cm NUMERIC,
    fetal_heart_rate INTEGER,
    fetal_presentation TEXT,
    edema BOOLEAN DEFAULT false,
    weight_kg NUMERIC,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    urine_protein TEXT,
    urine_glucose TEXT,
    notes TEXT,
    attending_staff_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on anc_enrollments
ALTER TABLE public.anc_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for anc_enrollments
CREATE POLICY "Users can view ANC enrollments in their org"
ON public.anc_enrollments
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create ANC enrollments in their org"
ON public.anc_enrollments
FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update ANC enrollments in their org"
ON public.anc_enrollments
FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete ANC enrollments in their org"
ON public.anc_enrollments
FOR DELETE
USING (organization_id = get_user_organization_id(auth.uid()));

-- Enable RLS on anc_visits
ALTER TABLE public.anc_visits ENABLE ROW LEVEL SECURITY;

-- RLS policies for anc_visits
CREATE POLICY "Users can view ANC visits in their org"
ON public.anc_visits
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create ANC visits in their org"
ON public.anc_visits
FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update ANC visits in their org"
ON public.anc_visits
FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete ANC visits in their org"
ON public.anc_visits
FOR DELETE
USING (organization_id = get_user_organization_id(auth.uid()));

-- Create trigger for updating timestamps
CREATE TRIGGER update_anc_enrollments_updated_at
BEFORE UPDATE ON public.anc_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_lab_requests_updated_at();

CREATE TRIGGER update_anc_visits_updated_at
BEFORE UPDATE ON public.anc_visits
FOR EACH ROW
EXECUTE FUNCTION public.update_lab_requests_updated_at();