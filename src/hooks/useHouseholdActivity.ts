import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HouseholdActivityEntry {
  id: string;
  network_id: string;
  actor_name: string;
  actor_email: string | null;
  action_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export const useHouseholdActivity = (networkId: string, limit = 50) => {
  return useQuery({
    queryKey: ['household-activity', networkId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('household_activity_log')
        .select('*')
        .eq('network_id', networkId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as HouseholdActivityEntry[];
    },
    enabled: !!networkId,
  });
};

export const useLogHouseholdActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<HouseholdActivityEntry, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('household_activity_log')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['household-activity', data.network_id] });
    },
  });
};
