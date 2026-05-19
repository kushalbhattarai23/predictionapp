
-- Add network_type to settlegara_networks
ALTER TABLE public.settlegara_networks 
ADD COLUMN IF NOT EXISTS network_type text NOT NULL DEFAULT 'standard';

-- Household categories table
CREATE TABLE IF NOT EXISTS public.household_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid REFERENCES public.settlegara_networks(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  icon text DEFAULT 'Tag',
  color text DEFAULT '#3B82F6',
  is_predefined boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.household_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Network members can view household categories"
  ON public.household_categories FOR SELECT
  USING (is_active_member(network_id, auth.email()));

CREATE POLICY "Network members can insert household categories"
  ON public.household_categories FOR INSERT
  WITH CHECK (is_active_member(network_id, auth.email()));

CREATE POLICY "Network members can update household categories"
  ON public.household_categories FOR UPDATE
  USING (is_active_member(network_id, auth.email()));

CREATE POLICY "Network members can delete household categories"
  ON public.household_categories FOR DELETE
  USING (is_active_member(network_id, auth.email()));

-- Household recurring expenses table
CREATE TABLE IF NOT EXISTS public.household_recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid REFERENCES public.settlegara_networks(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  category_id uuid REFERENCES public.household_categories(id) ON DELETE SET NULL,
  frequency text NOT NULL DEFAULT 'monthly',
  next_due_date date NOT NULL,
  last_generated_at timestamptz,
  paid_by_member_id uuid REFERENCES public.settlegara_network_members(id) ON DELETE SET NULL,
  split_type text DEFAULT 'equal',
  auto_generate boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.household_recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Network members can view recurring expenses"
  ON public.household_recurring_expenses FOR SELECT
  USING (is_active_member(network_id, auth.email()));

CREATE POLICY "Network members can insert recurring expenses"
  ON public.household_recurring_expenses FOR INSERT
  WITH CHECK (is_active_member(network_id, auth.email()));

CREATE POLICY "Network members can update recurring expenses"
  ON public.household_recurring_expenses FOR UPDATE
  USING (is_active_member(network_id, auth.email()));

CREATE POLICY "Network members can delete recurring expenses"
  ON public.household_recurring_expenses FOR DELETE
  USING (is_active_member(network_id, auth.email()));

-- Household activity log table
CREATE TABLE IF NOT EXISTS public.household_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid REFERENCES public.settlegara_networks(id) ON DELETE CASCADE NOT NULL,
  actor_name text NOT NULL,
  actor_email text,
  action_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.household_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Network members can view activity log"
  ON public.household_activity_log FOR SELECT
  USING (is_active_member(network_id, auth.email()));

CREATE POLICY "Network members can insert activity log"
  ON public.household_activity_log FOR INSERT
  WITH CHECK (is_active_member(network_id, auth.email()));
