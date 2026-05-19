
CREATE TABLE public.page_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL UNIQUE,
  title text,
  meta_description text,
  meta_keywords text,
  og_title text,
  og_description text,
  canonical_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_metadata ENABLE ROW LEVEL SECURITY;

-- Anyone can read page metadata (needed for SEO on public pages)
CREATE POLICY "Anyone can read page metadata"
  ON public.page_metadata
  FOR SELECT
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert page metadata"
  ON public.page_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update page metadata"
  ON public.page_metadata
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete page metadata"
  ON public.page_metadata
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_page_metadata_updated_at
  BEFORE UPDATE ON public.page_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
