-- Fix RLS policies for settlegara_item_assignments to use auth.email() instead of querying auth.users
DROP POLICY IF EXISTS "Users can insert item assignments for their network bills" ON public.settlegara_item_assignments;
DROP POLICY IF EXISTS "Users can view item assignments for their network bills" ON public.settlegara_item_assignments;
DROP POLICY IF EXISTS "Users can update item assignments for their network bills" ON public.settlegara_item_assignments;
DROP POLICY IF EXISTS "Users can delete item assignments for their network bills" ON public.settlegara_item_assignments;

-- Recreate with auth.email()
CREATE POLICY "Users can insert item assignments for their network bills"
ON public.settlegara_item_assignments
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM settlegara_bill_items bi
  JOIN settlegara_bills b ON b.id = bi.bill_id
  JOIN settlegara_network_members m ON m.network_id = b.network_id
  WHERE bi.id = settlegara_item_assignments.item_id
    AND m.user_email = auth.email()
    AND m.status = 'active'
));

CREATE POLICY "Users can view item assignments for their network bills"
ON public.settlegara_item_assignments
FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM settlegara_bill_items bi
  JOIN settlegara_bills b ON b.id = bi.bill_id
  JOIN settlegara_network_members m ON m.network_id = b.network_id
  WHERE bi.id = settlegara_item_assignments.item_id
    AND m.user_email = auth.email()
    AND m.status = 'active'
));

CREATE POLICY "Users can update item assignments for their network bills"
ON public.settlegara_item_assignments
FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM settlegara_bill_items bi
  JOIN settlegara_bills b ON b.id = bi.bill_id
  JOIN settlegara_network_members m ON m.network_id = b.network_id
  WHERE bi.id = settlegara_item_assignments.item_id
    AND m.user_email = auth.email()
    AND m.status = 'active'
));

CREATE POLICY "Users can delete item assignments for their network bills"
ON public.settlegara_item_assignments
FOR DELETE
USING (EXISTS (
  SELECT 1
  FROM settlegara_bill_items bi
  JOIN settlegara_bills b ON b.id = bi.bill_id
  JOIN settlegara_network_members m ON m.network_id = b.network_id
  WHERE bi.id = settlegara_item_assignments.item_id
    AND m.user_email = auth.email()
    AND m.status = 'active'
));