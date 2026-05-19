
-- Fix infinite recursion in RLS policies by creating security definer functions

-- Create security definer function to get user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create security definer function to check if user is member of network
CREATE OR REPLACE FUNCTION public.is_network_member(network_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM settlegara_network_members 
    WHERE settlegara_network_members.network_id = is_network_member.network_id 
    AND settlegara_network_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view networks they belong to" ON settlegara_networks;
DROP POLICY IF EXISTS "Users can update networks they created" ON settlegara_networks;
DROP POLICY IF EXISTS "Users can delete networks they created" ON settlegara_networks;

-- Recreate policies using security definer functions
CREATE POLICY "Users can view networks they belong to" ON settlegara_networks
  FOR SELECT USING (
    creator_id = auth.uid() OR public.is_network_member(id)
  );

CREATE POLICY "Users can update networks they created" ON settlegara_networks
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can delete networks they created" ON settlegara_networks
  FOR DELETE USING (creator_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE settlegara_networks ENABLE ROW LEVEL SECURITY;
