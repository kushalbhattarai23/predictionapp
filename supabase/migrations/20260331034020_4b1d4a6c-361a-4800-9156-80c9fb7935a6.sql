ALTER TABLE public.settlegara_bills 
ADD COLUMN discount_excluded_members text[] DEFAULT '{}'::text[];