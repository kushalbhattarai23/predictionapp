
-- Drop all existing problematic policies for settlegara_networks
DROP POLICY IF EXISTS "Users can view networks they belong to" ON settlegara_networks;
DROP POLICY IF EXISTS "Users can view networks they created or are members of" ON settlegara_networks;
DROP POLICY IF EXISTS "Users can view networks they created" ON settlegara_networks;
DROP POLICY IF EXISTS "Users can view networks where they are members" ON settlegara_networks;
DROP POLICY IF EXISTS "Users can update networks they created" ON settlegara_networks;
DROP POLICY IF EXISTS "Users can delete networks they created" ON settlegara_networks;
DROP POLICY IF EXISTS "Users can create networks" ON settlegara_networks;
DROP POLICY IF EXISTS "Users can update their networks" ON settlegara_networks;
DROP POLICY IF EXISTS "Users can delete their networks" ON settlegara_networks;

-- Create new RLS policies without recursion
CREATE POLICY "Network creators can view their networks" 
  ON settlegara_networks 
  FOR SELECT 
  USING (creator_id = auth.uid());

CREATE POLICY "Network members can view networks" 
  ON settlegara_networks 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM settlegara_network_members 
      WHERE network_id = settlegara_networks.id 
      AND user_email = auth.email()::text 
      AND status = 'active'
    )
  );

CREATE POLICY "Users can create networks" 
  ON settlegara_networks 
  FOR INSERT 
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Network creators can update their networks" 
  ON settlegara_networks 
  FOR UPDATE 
  USING (creator_id = auth.uid());

CREATE POLICY "Network creators can delete their networks" 
  ON settlegara_networks 
  FOR DELETE 
  USING (creator_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE settlegara_networks ENABLE ROW LEVEL SECURITY;
