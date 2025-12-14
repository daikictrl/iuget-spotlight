-- Add explicit RLS policies on user_roles to prevent privilege escalation
-- These policies ensure only admins can modify roles, even if application code has bugs

-- Policy: Prevent any direct role insertion (only allowed via SECURITY DEFINER trigger)
CREATE POLICY "No direct role insertion"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

-- Policy: Only admins can update roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));