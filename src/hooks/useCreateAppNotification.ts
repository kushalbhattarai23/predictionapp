import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export const useCreateAppNotification = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notify = async (type: string, title: string, message: string, metadata?: Record<string, any>) => {
    if (!user?.id) return;
    try {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type,
        title,
        message,
        metadata: metadata || {},
      });
      queryClient.invalidateQueries({ queryKey: ['app-notifications'] });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  return { notify };
};
