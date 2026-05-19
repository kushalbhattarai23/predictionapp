CREATE POLICY "Network admins can update shares"
ON public.settlegara_final_calculation_shares
FOR UPDATE
TO authenticated
USING (
  public.is_network_admin(network_id, (SELECT email FROM auth.users WHERE id = auth.uid()))
)
WITH CHECK (
  public.is_network_admin(network_id, (SELECT email FROM auth.users WHERE id = auth.uid()))
);