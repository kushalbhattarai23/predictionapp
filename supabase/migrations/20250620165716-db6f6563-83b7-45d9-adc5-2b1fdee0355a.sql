
-- Fix the circular dependency in network members RLS policy
-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view network members for networks they have access to" ON public.settlegara_network_members;
DROP POLICY IF EXISTS "Network creators can manage members" ON public.settlegara_network_members;

-- Recreate simpler policies without circular references
CREATE POLICY "Users can view network members for networks they created" 
  ON public.settlegara_network_members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_networks 
      WHERE id = network_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own membership" 
  ON public.settlegara_network_members 
  FOR SELECT 
  USING (user_email = auth.email());

CREATE POLICY "Network creators can insert members" 
  ON public.settlegara_network_members 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.settlegara_networks 
      WHERE id = network_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Network creators can update members" 
  ON public.settlegara_network_members 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_networks 
      WHERE id = network_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Network creators can delete members" 
  ON public.settlegara_network_members 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_networks 
      WHERE id = network_id AND creator_id = auth.uid()
    )
  );

-- Also fix the networks policy to remove circular reference
DROP POLICY IF EXISTS "Users can view networks they created or are members of" ON public.settlegara_networks;

CREATE POLICY "Users can view networks they created" 
  ON public.settlegara_networks 
  FOR SELECT 
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view networks they are members of" 
  ON public.settlegara_networks 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_network_members 
      WHERE network_id = id AND user_email = auth.email()
    )
  );

-- Fix bills policy to remove circular reference
DROP POLICY IF EXISTS "Users can view bills for networks they have access to" ON public.settlegara_bills;

CREATE POLICY "Users can view bills for networks they created" 
  ON public.settlegara_bills 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_networks 
      WHERE id = network_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can view bills for networks they are members of" 
  ON public.settlegara_bills 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_network_members 
      WHERE network_id = settlegara_bills.network_id AND user_email = auth.email()
    )
  );

-- Fix network members bill creation policy
DROP POLICY IF EXISTS "Network members can create bills" ON public.settlegara_bills;

CREATE POLICY "Network creators and members can create bills" 
  ON public.settlegara_bills 
  FOR INSERT 
  WITH CHECK (
    created_by = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM public.settlegara_networks 
        WHERE id = network_id AND creator_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.settlegara_network_members 
        WHERE network_id = settlegara_bills.network_id AND user_email = auth.email()
      )
    )
  );
