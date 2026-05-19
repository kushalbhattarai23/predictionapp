
-- Create storage bucket for settle bill public link images
INSERT INTO storage.buckets (id, name, public) VALUES ('settlebill-images', 'settlebill-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload settlebill images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'settlebill-images' AND auth.uid() IS NOT NULL);

-- Allow anyone to view settlebill images (public links)
CREATE POLICY "Anyone can view settlebill images"
ON storage.objects FOR SELECT
USING (bucket_id = 'settlebill-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete settlebill images"
ON storage.objects FOR DELETE
USING (bucket_id = 'settlebill-images' AND auth.uid() IS NOT NULL);
