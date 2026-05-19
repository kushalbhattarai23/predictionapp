-- Add UPDATE policy for settlegara_bill_items
CREATE POLICY "Users can update bill items for their network bills"
ON public.settlegara_bill_items
FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM settlegara_bills b
  JOIN settlegara_network_members m ON m.network_id = b.network_id
  WHERE b.id = settlegara_bill_items.bill_id
    AND m.user_email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
    AND m.status = 'active'
));