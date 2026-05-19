
-- Add columns to user_show_tracking table to store calculated episode counts
ALTER TABLE public.user_show_tracking 
ADD COLUMN total_episodes integer DEFAULT 0,
ADD COLUMN watched_episodes integer DEFAULT 0,
ADD COLUMN last_updated timestamp with time zone DEFAULT now();

-- Create a function to recalculate episode counts for a user's show
CREATE OR REPLACE FUNCTION public.update_user_show_episode_counts(p_user_id uuid, p_show_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_episodes integer;
  v_watched_episodes integer;
BEGIN
  -- Get total episodes for the show
  SELECT COUNT(*) INTO v_total_episodes
  FROM public.episodes
  WHERE show_id = p_show_id;
  
  -- Get watched episodes count for this user and show
  SELECT COUNT(*) INTO v_watched_episodes
  FROM public.user_episode_status ues
  JOIN public.episodes e ON ues.episode_id = e.id
  WHERE ues.user_id = p_user_id 
    AND e.show_id = p_show_id 
    AND ues.status = 'watched';
  
  -- Update the tracking record
  UPDATE public.user_show_tracking
  SET 
    total_episodes = v_total_episodes,
    watched_episodes = v_watched_episodes,
    last_updated = now()
  WHERE user_id = p_user_id AND show_id = p_show_id;
END;
$$;

-- Create a function to update episode counts when episode status changes
CREATE OR REPLACE FUNCTION public.handle_episode_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_show_id uuid;
BEGIN
  -- Get the show_id from the episode
  SELECT show_id INTO v_show_id
  FROM public.episodes
  WHERE id = COALESCE(NEW.episode_id, OLD.episode_id);
  
  -- Update the episode counts for this user and show
  PERFORM public.update_user_show_episode_counts(
    COALESCE(NEW.user_id, OLD.user_id), 
    v_show_id
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to automatically update episode counts when episode status changes
CREATE TRIGGER trigger_update_episode_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.user_episode_status
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_episode_status_change();

-- Create a function to update episode counts when new episodes are added
CREATE OR REPLACE FUNCTION public.handle_episode_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update episode counts for all users tracking this show
  UPDATE public.user_show_tracking
  SET 
    total_episodes = (
      SELECT COUNT(*) 
      FROM public.episodes 
      WHERE show_id = COALESCE(NEW.show_id, OLD.show_id)
    ),
    last_updated = now()
  WHERE show_id = COALESCE(NEW.show_id, OLD.show_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to automatically update episode counts when episodes are added/removed
CREATE TRIGGER trigger_update_episode_counts_on_episode_change
  AFTER INSERT OR UPDATE OR DELETE ON public.episodes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_episode_change();

-- Populate existing records with calculated values
DO $$
DECLARE
  tracking_record RECORD;
BEGIN
  FOR tracking_record IN 
    SELECT user_id, show_id FROM public.user_show_tracking
  LOOP
    PERFORM public.update_user_show_episode_counts(
      tracking_record.user_id, 
      tracking_record.show_id
    );
  END LOOP;
END;
$$;
