
-- Add slug and is_public to movies table
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS rewatch_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS runtime_minutes integer;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS overview text;

-- Create movie_universes table
CREATE TABLE public.movie_universes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slug text,
  is_public boolean NOT NULL DEFAULT false,
  creator_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.movie_universes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own movie universes" ON public.movie_universes
  FOR SELECT TO authenticated USING (creator_id = auth.uid());
CREATE POLICY "Anyone can view public movie universes" ON public.movie_universes
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create movie universes" ON public.movie_universes
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Users can update own movie universes" ON public.movie_universes
  FOR UPDATE TO authenticated USING (creator_id = auth.uid());
CREATE POLICY "Users can delete own movie universes" ON public.movie_universes
  FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- Create movie_universe_items table
CREATE TABLE public.movie_universe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  universe_id uuid NOT NULL REFERENCES public.movie_universes(id) ON DELETE CASCADE,
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  timeline_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(universe_id, movie_id)
);

ALTER TABLE public.movie_universe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view universe items for own universes" ON public.movie_universe_items
  FOR SELECT TO authenticated USING (
    universe_id IN (SELECT id FROM public.movie_universes WHERE creator_id = auth.uid())
  );
CREATE POLICY "Anyone can view public universe items" ON public.movie_universe_items
  FOR SELECT USING (
    universe_id IN (SELECT id FROM public.movie_universes WHERE is_public = true)
  );
CREATE POLICY "Users can insert universe items for own universes" ON public.movie_universe_items
  FOR INSERT TO authenticated WITH CHECK (
    universe_id IN (SELECT id FROM public.movie_universes WHERE creator_id = auth.uid())
  );
CREATE POLICY "Users can update universe items for own universes" ON public.movie_universe_items
  FOR UPDATE TO authenticated USING (
    universe_id IN (SELECT id FROM public.movie_universes WHERE creator_id = auth.uid())
  );
CREATE POLICY "Users can delete universe items for own universes" ON public.movie_universe_items
  FOR DELETE TO authenticated USING (
    universe_id IN (SELECT id FROM public.movie_universes WHERE creator_id = auth.uid())
  );

-- Add RLS policy for public movies
CREATE POLICY "Anyone can view public movies" ON public.movies
  FOR SELECT USING (is_public = true);
