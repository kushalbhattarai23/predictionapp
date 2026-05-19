
-- Fix the circular dependency in settlegara_networks RLS policies
-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view networks they are members of" ON public.settlegara_networks;

-- The existing policies from the migration are good, but let's ensure they work
-- Check if we have the right policies in place
DO $$
BEGIN
  -- Ensure we have the basic policies for network creators
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'settlegara_networks' 
    AND policyname = 'Users can view networks they created'
  ) THEN
    CREATE POLICY "Users can view networks they created" 
      ON public.settlegara_networks 
      FOR SELECT 
      USING (creator_id = auth.uid());
  END IF;

  -- Create a simpler policy for network members that doesn't cause recursion
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'settlegara_networks' 
    AND policyname = 'Users can view networks where they are members'
  ) THEN
    CREATE POLICY "Users can view networks where they are members" 
      ON public.settlegara_networks 
      FOR SELECT 
      USING (
        id IN (
          SELECT network_id 
          FROM public.settlegara_network_members 
          WHERE user_email = auth.email() AND status = 'active'
        )
      );
  END IF;

  -- Ensure users can create networks
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'settlegara_networks' 
    AND policyname = 'Users can create networks'
  ) THEN
    CREATE POLICY "Users can create networks" 
      ON public.settlegara_networks 
      FOR INSERT 
      WITH CHECK (creator_id = auth.uid());
  END IF;

  -- Allow network creators to update their networks
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'settlegara_networks' 
    AND policyname = 'Users can update their networks'
  ) THEN
    CREATE POLICY "Users can update their networks" 
      ON public.settlegara_networks 
      FOR UPDATE 
      USING (creator_id = auth.uid());
  END IF;
END $$;
