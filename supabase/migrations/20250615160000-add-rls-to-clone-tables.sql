
-- Create role type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END$$;

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check if user_roles table exists before querying
  IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_roles'
  ) THEN
      SELECT EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
      ) INTO is_admin_user;
  ELSE
      is_admin_user := false;
  END IF;

  RETURN is_admin_user;
END;
$$;


-- Function to check if the current user is the creator of a universe
CREATE OR REPLACE FUNCTION public.is_universe_creator(_universe_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.universes
    WHERE id = _universe_id AND creator_id = auth.uid()
  );
$$;

-- Function to check if the current user is the creator of a show
CREATE OR REPLACE FUNCTION public.is_show_creator(_show_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shows
    WHERE id = _show_id AND creator_id = auth.uid()
  );
$$;

-- Enable RLS on clone tables
ALTER TABLE public.universes_clone ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows_clone ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_universes_clone ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes_clone ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on clone tables to avoid conflicts
DROP POLICY IF EXISTS "Enable all for users" ON public.universes_clone;
DROP POLICY IF EXISTS "Public universes_clone are viewable by everyone" ON public.universes_clone;
DROP POLICY IF EXISTS "Authenticated users can insert universes_clone" ON public.universes_clone;
DROP POLICY IF EXISTS "Creators can update their own universes_clone" ON public.universes_clone;
DROP POLICY IF EXISTS "Creators can delete their own universes_clone" ON public.universes_clone;
DROP POLICY IF EXISTS "Admins can manage all universes_clone" ON public.universes_clone;

DROP POLICY IF EXISTS "Enable all for users" ON public.shows_clone;
DROP POLICY IF EXISTS "Public shows_clone are viewable by everyone" ON public.shows_clone;
DROP POLICY IF EXISTS "Creators can view their own private shows_clone" ON public.shows_clone;
DROP POLICY IF EXISTS "Authenticated users can insert shows_clone" ON public.shows_clone;
DROP POLICY IF EXISTS "Creators can update their own shows_clone" ON public.shows_clone;
DROP POLICY IF EXISTS "Creators can delete their own shows_clone" ON public.shows_clone;
DROP POLICY IF EXISTS "Admins can manage all shows_clone" ON public.shows_clone;

DROP POLICY IF EXISTS "Enable all for users" ON public.show_universes_clone;
DROP POLICY IF EXISTS "Public show_universes_clone are viewable by everyone" ON public.show_universes_clone;
DROP POLICY IF EXISTS "Universe creators can manage their show_universes_clone" ON public.show_universes_clone;
DROP POLICY IF EXISTS "Admins can manage all show_universes_clone" ON public.show_universes_clone;

DROP POLICY IF EXISTS "Enable all for users" ON public.episodes_clone;
DROP POLICY IF EXISTS "Public episodes_clone are viewable by everyone" ON public.episodes_clone;
DROP POLICY IF EXISTS "Show creators can manage their episodes_clone" ON public.episodes_clone;
DROP POLICY IF EXISTS "Admins can manage all episodes_clone" ON public.episodes_clone;

-- Policies for universes_clone
CREATE POLICY "Public universes_clone are viewable by everyone" ON public.universes_clone FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert universes_clone" ON public.universes_clone FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creators can update their own universes_clone" ON public.universes_clone FOR UPDATE USING (public.is_universe_creator(id)) WITH CHECK (public.is_universe_creator(id));
CREATE POLICY "Creators can delete their own universes_clone" ON public.universes_clone FOR DELETE USING (public.is_universe_creator(id));
CREATE POLICY "Admins can manage all universes_clone" ON public.universes_clone FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for shows_clone
CREATE POLICY "Public shows_clone are viewable by everyone" ON public.shows_clone FOR SELECT USING (is_public);
CREATE POLICY "Creators can view their own private shows_clone" ON public.shows_clone FOR SELECT USING (public.is_show_creator(id));
CREATE POLICY "Authenticated users can insert shows_clone" ON public.shows_clone FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creators can update their own shows_clone" ON public.shows_clone FOR UPDATE USING (public.is_show_creator(id)) WITH CHECK (public.is_show_creator(id));
CREATE POLICY "Creators can delete their own shows_clone" ON public.shows_clone FOR DELETE USING (public.is_show_creator(id));
CREATE POLICY "Admins can manage all shows_clone" ON public.shows_clone FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for show_universes_clone
CREATE POLICY "Public show_universes_clone are viewable by everyone" ON public.show_universes_clone FOR SELECT USING (true);
CREATE POLICY "Universe creators can manage their show_universes_clone" ON public.show_universes_clone FOR ALL USING (public.is_universe_creator(universe_id)) WITH CHECK (public.is_universe_creator(universe_id));
CREATE POLICY "Admins can manage all show_universes_clone" ON public.show_universes_clone FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for episodes_clone
CREATE POLICY "Public episodes_clone are viewable by everyone" ON public.episodes_clone FOR SELECT USING (true);
CREATE POLICY "Show creators can manage their episodes_clone" ON public.episodes_clone FOR ALL USING (public.is_show_creator(show_id)) WITH CHECK (public.is_show_creator(show_id));
CREATE POLICY "Admins can manage all episodes_clone" ON public.episodes_clone FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

