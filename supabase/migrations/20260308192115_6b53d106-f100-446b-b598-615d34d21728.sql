
-- Add source_app column to settlegara_bills to distinguish between household and settlebill data
ALTER TABLE public.settlegara_bills 
ADD COLUMN IF NOT EXISTS source_app text NOT NULL DEFAULT 'settlebill';

-- Update existing bills that belong to household networks to be marked as 'household'
UPDATE public.settlegara_bills 
SET source_app = 'household'
WHERE network_id IN (
  SELECT id FROM public.settlegara_networks WHERE network_type = 'household'
);
