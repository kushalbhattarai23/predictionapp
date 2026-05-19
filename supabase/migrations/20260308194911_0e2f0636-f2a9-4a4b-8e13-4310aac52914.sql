
CREATE TABLE public.settlegara_member_wallet_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network_id UUID NOT NULL REFERENCES public.settlegara_networks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.settlegara_network_members(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.settlegara_member_wallet_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Network members can view wallet images"
  ON public.settlegara_member_wallet_images
  FOR SELECT
  TO authenticated
  USING (is_active_member(network_id, auth.email()));

CREATE POLICY "Network members can insert wallet images"
  ON public.settlegara_member_wallet_images
  FOR INSERT
  TO authenticated
  WITH CHECK (is_active_member(network_id, auth.email()));

CREATE POLICY "Network members can delete wallet images"
  ON public.settlegara_member_wallet_images
  FOR DELETE
  TO authenticated
  USING (is_active_member(network_id, auth.email()));
