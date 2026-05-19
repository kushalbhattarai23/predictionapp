
-- First, let's fix the RLS policies for network members to allow proper access
-- Drop existing problematic policies for network members
DROP POLICY IF EXISTS "Network creators can manage members" ON public.settlegara_network_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.settlegara_network_members;
DROP POLICY IF EXISTS "Network members can view other network members" ON public.settlegara_network_members;

-- Create comprehensive policies that allow network members to view and manage
CREATE POLICY "Network creators and admins can manage all members" 
  ON public.settlegara_network_members 
  FOR ALL 
  USING (
    -- Network creators can manage all members
    EXISTS (
      SELECT 1 FROM public.settlegara_networks 
      WHERE id = network_id AND creator_id = auth.uid()
    )
    OR
    -- Network admins can manage all members
    EXISTS (
      SELECT 1 FROM public.settlegara_network_members admin_member
      WHERE admin_member.network_id = settlegara_network_members.network_id 
      AND admin_member.user_email = auth.email()::text 
      AND admin_member.role = 'admin' 
      AND admin_member.status = 'active'
    )
  )
  WITH CHECK (
    -- Same conditions for INSERT/UPDATE
    EXISTS (
      SELECT 1 FROM public.settlegara_networks 
      WHERE id = network_id AND creator_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.settlegara_network_members admin_member
      WHERE admin_member.network_id = settlegara_network_members.network_id 
      AND admin_member.user_email = auth.email()::text 
      AND admin_member.role = 'admin' 
      AND admin_member.status = 'active'
    )
  );

-- Allow all network members to view other members in their networks
CREATE POLICY "Network members can view other members" 
  ON public.settlegara_network_members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_network_members my_membership
      WHERE my_membership.network_id = settlegara_network_members.network_id 
      AND my_membership.user_email = auth.email()::text 
      AND my_membership.status = 'active'
    )
  );

-- Allow users to view their own membership records
CREATE POLICY "Users can view their own membership records" 
  ON public.settlegara_network_members 
  FOR SELECT 
  USING (user_email = auth.email()::text);

-- Now let's add RLS policies for bills and bill splits
-- First, add RLS policies for settlegara_bills table
CREATE POLICY "Network members can view bills in their networks" 
  ON public.settlegara_bills 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_network_members 
      WHERE network_id = settlegara_bills.network_id 
      AND user_email = auth.email()::text 
      AND status = 'active'
    )
  );

CREATE POLICY "Network members can create bills in their networks" 
  ON public.settlegara_bills 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.settlegara_network_members 
      WHERE network_id = settlegara_bills.network_id 
      AND user_email = auth.email()::text 
      AND status = 'active'
    )
  );

CREATE POLICY "Bill creators and network admins can update bills" 
  ON public.settlegara_bills 
  FOR UPDATE 
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.settlegara_network_members 
      WHERE network_id = settlegara_bills.network_id 
      AND user_email = auth.email()::text 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- Add RLS policies for bill splits
CREATE POLICY "Network members can view bill splits for their network bills" 
  ON public.settlegara_bill_splits 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_bills b
      JOIN public.settlegara_network_members nm ON b.network_id = nm.network_id
      WHERE b.id = settlegara_bill_splits.bill_id 
      AND nm.user_email = auth.email()::text 
      AND nm.status = 'active'
    )
  );

CREATE POLICY "Bill creators and network members can manage splits" 
  ON public.settlegara_bill_splits 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_bills b
      JOIN public.settlegara_network_members nm ON b.network_id = nm.network_id
      WHERE b.id = settlegara_bill_splits.bill_id 
      AND (b.created_by = auth.uid() OR nm.user_email = auth.email()::text)
      AND nm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.settlegara_bills b
      JOIN public.settlegara_network_members nm ON b.network_id = nm.network_id
      WHERE b.id = settlegara_bill_splits.bill_id 
      AND (b.created_by = auth.uid() OR nm.user_email = auth.email()::text)
      AND nm.status = 'active'
    )
  );

-- Enable RLS on all tables
ALTER TABLE public.settlegara_network_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlegara_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlegara_bill_splits ENABLE ROW LEVEL SECURITY;
