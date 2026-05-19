
-- Add settlement tracking to bill splits
ALTER TABLE settlegara_bill_splits 
ADD COLUMN settled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN settled_by UUID REFERENCES auth.users(id);

-- Add currency preference to user profiles
ALTER TABLE profiles 
ADD COLUMN preferred_currency TEXT DEFAULT 'USD';

-- Create a table to track simplified settlements
CREATE TABLE settlegara_settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network_id UUID NOT NULL REFERENCES settlegara_networks(id) ON DELETE CASCADE,
  from_member_id UUID NOT NULL REFERENCES settlegara_network_members(id),
  to_member_id UUID NOT NULL REFERENCES settlegara_network_members(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on settlements table
ALTER TABLE settlegara_settlements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for settlements
CREATE POLICY "Users can view settlements in their networks" 
  ON settlegara_settlements 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM settlegara_network_members 
      WHERE network_id = settlegara_settlements.network_id 
      AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Users can create settlements in their networks" 
  ON settlegara_settlements 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM settlegara_network_members 
      WHERE network_id = settlegara_settlements.network_id 
      AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Users can update settlements they created" 
  ON settlegara_settlements 
  FOR UPDATE 
  USING (auth.uid() = created_by);
