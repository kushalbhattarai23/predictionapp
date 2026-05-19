
-- Create inventory_stores table
CREATE TABLE public.inventory_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add store_id to inventory_items_tracker
ALTER TABLE public.inventory_items_tracker
  ADD COLUMN store_id UUID REFERENCES public.inventory_stores(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.inventory_stores ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_stores
CREATE POLICY "Users can view own stores" ON public.inventory_stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stores" ON public.inventory_stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores" ON public.inventory_stores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stores" ON public.inventory_stores
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER update_inventory_stores_updated_at
  BEFORE UPDATE ON public.inventory_stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
