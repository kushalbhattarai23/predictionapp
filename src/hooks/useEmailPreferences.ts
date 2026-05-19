import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface EmailPreferences {
  welcome_email: boolean;
  finance_summary: boolean;
  movies_summary: boolean;
  tv_shows_summary: boolean;
  settlebill_summary: boolean;
  household_summary: boolean;
  inventory_summary: boolean;
  weekly_digest: boolean;
  monthly_digest: boolean;
}

const defaults: EmailPreferences = {
  welcome_email: true,
  finance_summary: true,
  movies_summary: true,
  tv_shows_summary: true,
  settlebill_summary: true,
  household_summary: true,
  inventory_summary: true,
  weekly_digest: false,
  monthly_digest: true,
};

export const useEmailPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['email-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return defaults;
      const { id, user_id, created_at, updated_at, ...prefs } = data;
      return prefs as EmailPreferences;
    },
    enabled: !!user,
  });

  const updatePreference = useMutation({
    mutationFn: async (updates: Partial<EmailPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_email_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-preferences'] });
      toast.success('Email preferences updated');
    },
    onError: () => toast.error('Failed to update preferences'),
  });

  return {
    preferences: preferences || defaults,
    isLoading,
    updatePreference,
  };
};
