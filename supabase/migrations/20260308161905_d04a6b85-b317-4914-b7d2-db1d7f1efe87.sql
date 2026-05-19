
-- Inventory Categories table
CREATE TABLE public.inventory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'Tag',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory Items table
CREATE TABLE public.inventory_items_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES public.settlegara_networks(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  min_stock NUMERIC NOT NULL DEFAULT 0,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  location TEXT,
  expiry_date DATE,
  notes TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory Transactions table
CREATE TABLE public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.inventory_items_tracker(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('added', 'consumed', 'adjusted', 'transferred')),
  quantity_change NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS for inventory_categories
CREATE POLICY "Users can view own inventory categories" ON public.inventory_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own inventory categories" ON public.inventory_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory categories" ON public.inventory_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory categories" ON public.inventory_categories FOR DELETE USING (auth.uid() = user_id);

-- RLS for inventory_items_tracker
CREATE POLICY "Users can view own inventory items" ON public.inventory_items_tracker FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own inventory items" ON public.inventory_items_tracker FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory items" ON public.inventory_items_tracker FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory items" ON public.inventory_items_tracker FOR DELETE USING (auth.uid() = user_id);

-- RLS for inventory_transactions
CREATE POLICY "Users can view own inventory transactions" ON public.inventory_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own inventory transactions" ON public.inventory_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory transactions" ON public.inventory_transactions FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_inventory_categories_updated_at BEFORE UPDATE ON public.inventory_categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_inventory_items_tracker_updated_at BEFORE UPDATE ON public.inventory_items_tracker FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
