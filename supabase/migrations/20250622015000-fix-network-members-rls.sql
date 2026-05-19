
-- Fix RLS policies for settlegara_network_members to allow proper access

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view network members for networks they created" ON public.settlegara_network_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.settlegara_network_members;
DROP POLICY IF EXISTS "Network creators can insert members" ON public.settlegara_network_members;
DROP POLICY IF EXISTS "Network creators can update members" ON public.settlegara_network_members;
DROP POLICY IF EXISTS "Network creators can delete members" ON public.settlegara_network_members;

-- Create new comprehensive policies
CREATE POLICY "Network creators can manage all members" 
  ON public.settlegara_network_members 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_networks 
      WHERE id = network_id AND creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.settlegara_networks 
      WHERE id = network_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own membership records" 
  ON public.settlegara_network_members 
  FOR SELECT 
  USING (
    user_email = auth.email()::text
  );

CREATE POLICY "Network members can view other members" 
  ON public.settlegara_network_members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_network_members snm2 
      WHERE snm2.network_id = settlegara_network_members.network_id 
      AND snm2.user_email = auth.email()::text 
      AND snm2.status = 'active'
    )
  );

-- Enable RLS
ALTER TABLE public.settlegara_network_members ENABLE ROW LEVEL SECURITY;
