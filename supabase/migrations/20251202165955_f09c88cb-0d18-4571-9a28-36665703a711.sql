-- RLS Policies for appointments
CREATE POLICY "Users can view appointments in their org" ON public.appointments
    FOR SELECT TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create appointments in their org" ON public.appointments
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update appointments in their org" ON public.appointments
    FOR UPDATE TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete appointments in their org" ON public.appointments
    FOR DELETE TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for inventory
CREATE POLICY "Users can view inventory in their org" ON public.inventory
    FOR SELECT TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create inventory in their org" ON public.inventory
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update inventory in their org" ON public.inventory
    FOR UPDATE TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete inventory in their org" ON public.inventory
    FOR DELETE TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices in their org" ON public.invoices
    FOR SELECT TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create invoices in their org" ON public.invoices
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update invoices in their org" ON public.invoices
    FOR UPDATE TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete invoices in their org" ON public.invoices
    FOR DELETE TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for vitals (via appointment)
CREATE POLICY "Users can view vitals for their org appointments" ON public.vitals
    FOR SELECT TO authenticated
    USING (
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can create vitals for their org appointments" ON public.vitals
    FOR INSERT TO authenticated
    WITH CHECK (
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can update vitals for their org appointments" ON public.vitals
    FOR UPDATE TO authenticated
    USING (
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can delete vitals for their org appointments" ON public.vitals
    FOR DELETE TO authenticated
    USING (
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );