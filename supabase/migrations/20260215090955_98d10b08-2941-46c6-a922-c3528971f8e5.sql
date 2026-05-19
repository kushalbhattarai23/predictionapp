
-- Add consumed_quantity column to settlegara_item_assignments
ALTER TABLE public.settlegara_item_assignments
ADD COLUMN consumed_quantity numeric NOT NULL DEFAULT 0;

-- Create settlegara_final_calculation_shares table for public sharing
CREATE TABLE public.settlegara_final_calculation_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network_id UUID NOT NULL REFERENCES public.settlegara_networks(id) ON DELETE CASCADE,
  share_id TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settlegara_final_calculation_shares ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view shared links without auth)
CREATE POLICY "Anyone can view shared final calculations"
ON public.settlegara_final_calculation_shares
FOR SELECT
USING (true);

-- Authenticated users can create shares
CREATE POLICY "Authenticated users can create shares"
ON public.settlegara_final_calculation_shares
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Creator or any authenticated user can delete shares
CREATE POLICY "Authenticated users can delete shares"
ON public.settlegara_final_calculation_shares
FOR DELETE
USING (auth.uid() IS NOT NULL);
