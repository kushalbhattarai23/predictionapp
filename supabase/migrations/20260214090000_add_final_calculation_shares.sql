CREATE TABLE public.settlegara_final_calculation_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES public.settlegara_networks(id) ON DELETE CASCADE,
  share_id TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.settlegara_final_calculation_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Network members can create final calculation shares"
ON public.settlegara_final_calculation_shares
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.settlegara_network_members m
    WHERE m.network_id = settlegara_final_calculation_shares.network_id
      AND m.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND m.status = 'active'
  )
);

CREATE POLICY "Network members can view their final calculation shares"
ON public.settlegara_final_calculation_shares
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.settlegara_network_members m
    WHERE m.network_id = settlegara_final_calculation_shares.network_id
      AND m.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND m.status = 'active'
  )
);

CREATE POLICY "Public can view shared final calculation pages"
ON public.settlegara_final_calculation_shares
FOR SELECT
TO anon
USING (true);

CREATE INDEX idx_settlegara_final_calculation_shares_network_id
  ON public.settlegara_final_calculation_shares(network_id);

CREATE INDEX idx_settlegara_final_calculation_shares_share_id
  ON public.settlegara_final_calculation_shares(share_id);
