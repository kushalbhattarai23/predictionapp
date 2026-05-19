CREATE OR REPLACE FUNCTION public.is_active_member(network uuid, email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.settlegara_network_members
    WHERE network_id = network
      AND user_email = email
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_network_admin(network uuid, email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.settlegara_network_members
    WHERE network_id = network
      AND user_email = email
      AND role = 'admin'
      AND status = 'active'
  );
$$;

DROP POLICY IF EXISTS "Network admins can update shares" ON public.settlegara_final_calculation_shares;

CREATE POLICY "Network admins can update shares"
ON public.settlegara_final_calculation_shares
FOR UPDATE
TO authenticated
USING (public.is_network_admin(network_id, auth.email()))
WITH CHECK (public.is_network_admin(network_id, auth.email()));