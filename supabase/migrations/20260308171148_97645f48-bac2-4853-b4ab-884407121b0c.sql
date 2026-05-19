
-- Shared Universes table
CREATE TABLE public.shared_universes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  cover_image text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Shared Universe Media table (links movies and TV shows)
CREATE TABLE public.shared_universe_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  universe_id uuid REFERENCES public.shared_universes(id) ON DELETE CASCADE NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('movie', 'tv_show')),
  media_id uuid NOT NULL,
  timeline_order integer NOT NULL DEFAULT 0,
  phase text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_universes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_universe_media ENABLE ROW LEVEL SECURITY;

-- RLS for shared_universes
CREATE POLICY "Users can create own shared universes"
  ON public.shared_universes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own shared universes"
  ON public.shared_universes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own shared universes"
  ON public.shared_universes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared universes"
  ON public.shared_universes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public shared universes"
  ON public.shared_universes FOR SELECT
  USING (visibility = 'public');

-- RLS for shared_universe_media
CREATE POLICY "Users can manage media in own universes"
  ON public.shared_universe_media FOR ALL TO authenticated
  USING (universe_id IN (SELECT id FROM public.shared_universes WHERE user_id = auth.uid()))
  WITH CHECK (universe_id IN (SELECT id FROM public.shared_universes WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view media in public universes"
  ON public.shared_universe_media FOR SELECT
  USING (universe_id IN (SELECT id FROM public.shared_universes WHERE visibility = 'public'));

-- Updated at trigger
CREATE TRIGGER update_shared_universes_updated_at
  BEFORE UPDATE ON public.shared_universes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add sharedUniverse to app settings
INSERT INTO public.user_app_preferences (user_id, app_name, enabled)
SELECT id, 'sharedUniverse', true FROM auth.users
ON CONFLICT DO NOTHING;
