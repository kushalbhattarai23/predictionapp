-- Add missing UPDATE policy on user_show_tracking
CREATE POLICY "Users can update their own show tracking"
ON public.user_show_tracking
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also make the RPC function SECURITY DEFINER so it bypasses RLS for the update
CREATE OR REPLACE FUNCTION public.update_user_show_episode_counts(p_user_id uuid, p_show_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_episodes integer;
  v_watched_episodes integer;
BEGIN
  SELECT COUNT(*) INTO v_total_episodes
  FROM public.episodes
  WHERE show_id = p_show_id;
  
  SELECT COUNT(*) INTO v_watched_episodes
  FROM public.user_episode_status ues
  JOIN public.episodes e ON ues.episode_id = e.id
  WHERE ues.user_id = p_user_id 
    AND e.show_id = p_show_id 
    AND ues.status = 'watched';
  
  UPDATE public.user_show_tracking
  SET 
    total_episodes = v_total_episodes,
    watched_episodes = v_watched_episodes,
    last_updated = now()
  WHERE user_id = p_user_id AND show_id = p_show_id;
END;
$$;