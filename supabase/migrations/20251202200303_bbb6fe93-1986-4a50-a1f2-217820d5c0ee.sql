-- Allow users to update their own organization
CREATE POLICY "Users can update their organization" 
ON public.organizations 
FOR UPDATE 
USING (id = get_user_organization_id(auth.uid()))
WITH CHECK (id = get_user_organization_id(auth.uid()));