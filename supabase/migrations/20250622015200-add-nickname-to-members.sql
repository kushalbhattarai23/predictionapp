
-- Add nickname column to settlegara_network_members
ALTER TABLE public.settlegara_network_members 
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Add index for nickname searches
CREATE INDEX IF NOT EXISTS idx_settlegara_network_members_nickname 
ON public.settlegara_network_members(nickname);
