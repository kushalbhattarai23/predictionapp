-- Create table for storing individual bill items (from OCR or manual entry)
CREATE TABLE public.settlegara_bill_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.settlegara_bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  rate NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing which members are assigned to which items
CREATE TABLE public.settlegara_item_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.settlegara_bill_items(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.settlegara_network_members(id) ON DELETE CASCADE,
  share_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id, member_id)
);

-- Add is_itemized column to bills to identify OCR-based bills
ALTER TABLE public.settlegara_bills ADD COLUMN IF NOT EXISTS is_itemized BOOLEAN DEFAULT FALSE;

-- Enable RLS on new tables
ALTER TABLE public.settlegara_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlegara_item_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for bill items (access through bill -> network membership)
CREATE POLICY "Users can view bill items for their network bills"
ON public.settlegara_bill_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.settlegara_bills b
    JOIN public.settlegara_network_members m ON m.network_id = b.network_id
    WHERE b.id = settlegara_bill_items.bill_id
    AND m.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND m.status = 'active'
  )
);

CREATE POLICY "Users can insert bill items for their network bills"
ON public.settlegara_bill_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.settlegara_bills b
    JOIN public.settlegara_network_members m ON m.network_id = b.network_id
    WHERE b.id = settlegara_bill_items.bill_id
    AND m.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND m.status = 'active'
  )
);

CREATE POLICY "Users can delete bill items for their network bills"
ON public.settlegara_bill_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.settlegara_bills b
    JOIN public.settlegara_network_members m ON m.network_id = b.network_id
    WHERE b.id = settlegara_bill_items.bill_id
    AND m.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND m.status = 'active'
  )
);

-- RLS policies for item assignments
CREATE POLICY "Users can view item assignments for their network bills"
ON public.settlegara_item_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.settlegara_bill_items bi
    JOIN public.settlegara_bills b ON b.id = bi.bill_id
    JOIN public.settlegara_network_members m ON m.network_id = b.network_id
    WHERE bi.id = settlegara_item_assignments.item_id
    AND m.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND m.status = 'active'
  )
);

CREATE POLICY "Users can insert item assignments for their network bills"
ON public.settlegara_item_assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.settlegara_bill_items bi
    JOIN public.settlegara_bills b ON b.id = bi.bill_id
    JOIN public.settlegara_network_members m ON m.network_id = b.network_id
    WHERE bi.id = settlegara_item_assignments.item_id
    AND m.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND m.status = 'active'
  )
);

CREATE POLICY "Users can delete item assignments for their network bills"
ON public.settlegara_item_assignments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.settlegara_bill_items bi
    JOIN public.settlegara_bills b ON b.id = bi.bill_id
    JOIN public.settlegara_network_members m ON m.network_id = b.network_id
    WHERE bi.id = settlegara_item_assignments.item_id
    AND m.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND m.status = 'active'
  )
);

-- Create indexes for performance
CREATE INDEX idx_bill_items_bill_id ON public.settlegara_bill_items(bill_id);
CREATE INDEX idx_item_assignments_item_id ON public.settlegara_item_assignments(item_id);
CREATE INDEX idx_item_assignments_member_id ON public.settlegara_item_assignments(member_id);

-- Fix the has_role function to add SET search_path protection (from security scan)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;