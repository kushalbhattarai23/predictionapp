-- Fix RLS policies for settlegara_bill_items that incorrectly query auth.users
-- This was causing: "permission denied for table users" on SELECT/INSERT.

-- Drop existing policies (names based on current DB introspection)
DROP POLICY IF EXISTS "Users can view bill items for their network bills" ON public.settlegara_bill_items;
DROP POLICY IF EXISTS "Users can insert bill items for their network bills" ON public.settlegara_bill_items;
DROP POLICY IF EXISTS "Users can update bill items for their network bills" ON public.settlegara_bill_items;
DROP POLICY IF EXISTS "Users can delete bill items for their network bills" ON public.settlegara_bill_items;

-- Recreate policies using auth.email() (no access to auth.users required)
CREATE POLICY "Users can view bill items for their network bills"
ON public.settlegara_bill_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.settlegara_bills b
    JOIN public.settlegara_network_members m ON m.network_id = b.network_id
    WHERE b.id = settlegara_bill_items.bill_id
      AND m.user_email = auth.email()
      AND m.status = 'active'
  )
);

CREATE POLICY "Users can insert bill items for their network bills"
ON public.settlegara_bill_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.settlegara_bills b
    JOIN public.settlegara_network_members m ON m.network_id = b.network_id
    WHERE b.id = settlegara_bill_items.bill_id
      AND m.user_email = auth.email()
      AND m.status = 'active'
  )
);

CREATE POLICY "Users can update bill items for their network bills"
ON public.settlegara_bill_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.settlegara_bills b
    JOIN public.settlegara_network_members m ON m.network_id = b.network_id
    WHERE b.id = settlegara_bill_items.bill_id
      AND m.user_email = auth.email()
      AND m.status = 'active'
  )
);

CREATE POLICY "Users can delete bill items for their network bills"
ON public.settlegara_bill_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.settlegara_bills b
    JOIN public.settlegara_network_members m ON m.network_id = b.network_id
    WHERE b.id = settlegara_bill_items.bill_id
      AND m.user_email = auth.email()
      AND m.status = 'active'
  )
);
