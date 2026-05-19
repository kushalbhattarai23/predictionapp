
-- Extend inventory_items_tracker with ecommerce fields
ALTER TABLE public.inventory_items_tracker
  ADD COLUMN IF NOT EXISTS is_sellable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS selling_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS product_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS product_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS product_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_for_delivery boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_order_quantity integer NOT NULL DEFAULT 10;

-- Store locations table
CREATE TABLE public.store_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  store_id uuid REFERENCES public.inventory_stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  lat numeric NOT NULL DEFAULT 0,
  lng numeric NOT NULL DEFAULT 0,
  delivery_radius_km numeric NOT NULL DEFAULT 3,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.store_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own store locations" ON public.store_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own store locations" ON public.store_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own store locations" ON public.store_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own store locations" ON public.store_locations FOR DELETE USING (auth.uid() = user_id);

-- Riders table
CREATE TABLE public.riders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text DEFAULT NULL,
  status text NOT NULL DEFAULT 'offline',
  vehicle_type text NOT NULL DEFAULT 'bike',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view riders" ON public.riders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create riders" ON public.riders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own riders" ON public.riders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own riders" ON public.riders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Rider locations table
CREATE TABLE public.rider_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id uuid NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
  lat numeric NOT NULL DEFAULT 0,
  lng numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view rider locations" ON public.rider_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Rider owner can insert locations" ON public.rider_locations FOR INSERT TO authenticated WITH CHECK (
  rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
);
CREATE POLICY "Rider owner can update locations" ON public.rider_locations FOR UPDATE TO authenticated USING (
  rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
);

-- Orders table
CREATE TABLE public.qc_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  store_location_id uuid REFERENCES public.store_locations(id),
  total_amount numeric NOT NULL DEFAULT 0,
  delivery_address text DEFAULT NULL,
  delivery_lat numeric DEFAULT NULL,
  delivery_lng numeric DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending',
  assigned_rider_id uuid REFERENCES public.riders(id),
  payment_method text NOT NULL DEFAULT 'cash',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.qc_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.qc_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.qc_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.qc_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins and riders can view all orders" ON public.qc_orders FOR SELECT TO authenticated USING (
  user_id IN (SELECT r.user_id FROM public.riders r WHERE r.id = qc_orders.assigned_rider_id)
  OR auth.uid() = user_id
);

-- Order items table
CREATE TABLE public.qc_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.qc_orders(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items_tracker(id),
  quantity numeric NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.qc_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON public.qc_order_items FOR SELECT TO authenticated USING (
  order_id IN (SELECT id FROM public.qc_orders WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create own order items" ON public.qc_order_items FOR INSERT TO authenticated WITH CHECK (
  order_id IN (SELECT id FROM public.qc_orders WHERE user_id = auth.uid())
);
