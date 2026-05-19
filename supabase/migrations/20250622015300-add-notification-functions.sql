
-- Function to select notifications with proper types
CREATE OR REPLACE FUNCTION public.select(query TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF query = 'SELECT * FROM settlegara_notifications ORDER BY created_at DESC' THEN
    SELECT json_agg(row_to_json(t))
    INTO result
    FROM (
      SELECT * FROM public.settlegara_notifications 
      WHERE user_email = auth.email()::text
      ORDER BY created_at DESC
    ) t;
    
    RETURN COALESCE(result, '[]'::json);
  END IF;
  
  RAISE EXCEPTION 'Query not allowed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update notification read status
CREATE OR REPLACE FUNCTION public.update_notification_read_status(notification_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE public.settlegara_notifications 
  SET read = true, updated_at = NOW()
  WHERE id = notification_id AND user_email = auth.email()::text
  RETURNING row_to_json(settlegara_notifications.*) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notifications count
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO count_result
  FROM public.settlegara_notifications
  WHERE user_email = auth.email()::text AND read = false;
  
  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
