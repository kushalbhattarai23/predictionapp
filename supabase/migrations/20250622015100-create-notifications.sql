
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.settlegara_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('member_added', 'bill_added', 'invitation', 'payment_reminder')),
  network_id UUID REFERENCES public.settlegara_networks(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.settlegara_bills(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_settlegara_notifications_user_email ON public.settlegara_notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_settlegara_notifications_network_id ON public.settlegara_notifications(network_id);
CREATE INDEX IF NOT EXISTS idx_settlegara_notifications_read ON public.settlegara_notifications(read);

-- Enable RLS
ALTER TABLE public.settlegara_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" 
  ON public.settlegara_notifications 
  FOR SELECT 
  USING (user_email = auth.email()::text);

CREATE POLICY "Users can update their own notifications" 
  ON public.settlegara_notifications 
  FOR UPDATE 
  USING (user_email = auth.email()::text);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_email TEXT,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_network_id UUID DEFAULT NULL,
  p_bill_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.settlegara_notifications (user_email, title, message, type, network_id, bill_id)
  VALUES (p_user_email, p_title, p_message, p_type, p_network_id, p_bill_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify network members when a bill is added
CREATE OR REPLACE FUNCTION public.notify_bill_added() RETURNS TRIGGER AS $$
DECLARE
  member_record RECORD;
  network_name TEXT;
BEGIN
  -- Get network name
  SELECT name INTO network_name FROM public.settlegara_networks WHERE id = NEW.network_id;
  
  -- Notify all network members except the bill creator
  FOR member_record IN 
    SELECT user_email FROM public.settlegara_network_members 
    WHERE network_id = NEW.network_id AND status = 'active'
  LOOP
    -- Don't notify the creator
    IF member_record.user_email != (SELECT email FROM auth.users WHERE id = NEW.created_by) THEN
      PERFORM public.create_notification(
        member_record.user_email,
        'New Bill Added',
        'A new bill "' || NEW.title || '" has been added to network "' || network_name || '"',
        'bill_added',
        NEW.network_id,
        NEW.id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for bill notifications
CREATE TRIGGER trigger_notify_bill_added
  AFTER INSERT ON public.settlegara_bills
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_bill_added();
