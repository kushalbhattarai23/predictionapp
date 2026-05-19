
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view networks they created or are members of" ON public.settlegara_networks;
DROP POLICY IF EXISTS "Users can create networks" ON public.settlegara_networks;
DROP POLICY IF EXISTS "Network creators can update their networks" ON public.settlegara_networks;
DROP POLICY IF EXISTS "Network creators can delete their networks" ON public.settlegara_networks;
DROP POLICY IF EXISTS "Users can view network members for networks they have access to" ON public.settlegara_network_members;
DROP POLICY IF EXISTS "Network creators can manage members" ON public.settlegara_network_members;
DROP POLICY IF EXISTS "Users can view bills for networks they have access to" ON public.settlegara_bills;
DROP POLICY IF EXISTS "Network members can create bills" ON public.settlegara_bills;
DROP POLICY IF EXISTS "Bill creators can update their bills" ON public.settlegara_bills;
DROP POLICY IF EXISTS "Bill creators can delete their bills" ON public.settlegara_bills;
DROP POLICY IF EXISTS "Users can view bill splits for accessible bills" ON public.settlegara_bill_splits;
DROP POLICY IF EXISTS "Bill creators can manage bill splits" ON public.settlegara_bill_splits;

-- Create new RLS policies for networks
CREATE POLICY "Users can view networks they created" 
  ON public.settlegara_networks 
  FOR SELECT 
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view networks where they are members" 
  ON public.settlegara_networks 
  FOR SELECT 
  USING (
    id IN (
      SELECT network_id 
      FROM public.settlegara_network_members 
      WHERE user_email = auth.email() AND status = 'active'
    )
  );

CREATE POLICY "Users can create networks" 
  ON public.settlegara_networks 
  FOR INSERT 
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their networks" 
  ON public.settlegara_networks 
  FOR UPDATE 
  USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their networks" 
  ON public.settlegara_networks 
  FOR DELETE 
  USING (creator_id = auth.uid());

-- Create RLS policies for network members
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

-- Create RLS policies for bills
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

CREATE POLICY "Users can update bills they created" 
  ON public.settlegara_bills 
  FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete bills they created" 
  ON public.settlegara_bills 
  FOR DELETE 
  USING (created_by = auth.uid());

-- Create RLS policies for bill splits
CREATE POLICY "Users can view bill splits for bills they have access to" 
  ON public.settlegara_bill_splits 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_bills b
      WHERE b.id = bill_id AND (
        b.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.settlegara_networks n
          WHERE n.id = b.network_id AND (
            n.creator_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.settlegara_network_members 
              WHERE network_id = n.id AND user_email = auth.email()
            )
          )
        )
      )
    )
  );

CREATE POLICY "Bill creators can manage splits" 
  ON public.settlegara_bill_splits 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.settlegara_bills 
      WHERE id = bill_id AND created_by = auth.uid()
    )
  );
