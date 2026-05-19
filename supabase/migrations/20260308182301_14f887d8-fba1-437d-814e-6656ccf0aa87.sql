
-- Image albums table (create first)
CREATE TABLE public.image_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_id UUID,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User images table
CREATE TABLE public.user_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  album_id UUID REFERENCES public.image_albums(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for album cover
ALTER TABLE public.image_albums ADD CONSTRAINT image_albums_cover_image_id_fkey FOREIGN KEY (cover_image_id) REFERENCES public.user_images(id) ON DELETE SET NULL;

-- Email preferences table
CREATE TABLE public.user_email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  welcome_email BOOLEAN DEFAULT true,
  finance_summary BOOLEAN DEFAULT true,
  movies_summary BOOLEAN DEFAULT true,
  tv_shows_summary BOOLEAN DEFAULT true,
  settlebill_summary BOOLEAN DEFAULT true,
  household_summary BOOLEAN DEFAULT true,
  inventory_summary BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  monthly_digest BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for user_images
ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own images" ON public.user_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public images" ON public.user_images FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create own images" ON public.user_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON public.user_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON public.user_images FOR DELETE USING (auth.uid() = user_id);

-- RLS for image_albums
ALTER TABLE public.image_albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own albums" ON public.image_albums FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public albums" ON public.image_albums FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create own albums" ON public.image_albums FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own albums" ON public.image_albums FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own albums" ON public.image_albums FOR DELETE USING (auth.uid() = user_id);

-- RLS for email preferences
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own email prefs" ON public.user_email_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own email prefs" ON public.user_email_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email prefs" ON public.user_email_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Storage bucket for user images
INSERT INTO storage.buckets (id, name, public) VALUES ('user-images', 'user-images', true);

-- Storage RLS
CREATE POLICY "Users can upload images to own folder" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view images in own folder" ON storage.objects FOR SELECT USING (bucket_id = 'user-images');
CREATE POLICY "Users can delete images in own folder" ON storage.objects FOR DELETE USING (bucket_id = 'user-images' AND (storage.foldername(name))[1] = auth.uid()::text);
