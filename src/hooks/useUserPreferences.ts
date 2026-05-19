
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserPreferences {
  preferred_currency: string;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user preferences:', error);
        return { preferred_currency: 'USD' };
      }
      
      return data as UserPreferences;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(preferences)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
    },
  });
};
