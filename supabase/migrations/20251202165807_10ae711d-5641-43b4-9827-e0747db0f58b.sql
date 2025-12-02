-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'nurse', 'receptionist', 'pharmacist');

-- Create user_roles table (secure role storage)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, role, organization_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to safely check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's organization_id safely
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- Hospital Registration Function
CREATE OR REPLACE FUNCTION public.register_hospital(
    hospital_name TEXT,
    user_id UUID,
    first_name TEXT,
    last_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create organization
    INSERT INTO public.organizations (name) 
    VALUES (hospital_name) 
    RETURNING id INTO new_org_id;
    
    -- Create profile linked to organization
    INSERT INTO public.profiles (id, first_name, last_name, organization_id, role)
    VALUES (user_id, first_name, last_name, new_org_id, 'admin');
    
    -- Assign admin role in user_roles table (secure)
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (user_id, 'admin', new_org_id);
    
    RETURN new_org_id;
END;
$$;

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can view profiles in same org" ON public.profiles
    FOR SELECT TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization" ON public.organizations
    FOR SELECT TO authenticated
    USING (id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());