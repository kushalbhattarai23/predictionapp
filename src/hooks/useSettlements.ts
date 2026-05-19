
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Settlement {
  id: string;
  network_id: string;
  from_member_id: string;
  to_member_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at: string | null;
  created_by: string;
}

export interface CreateSettlement {
  network_id: string;
  from_member_id: string;
  to_member_id: string;
  amount: number;
  currency: string;
}

export const useSettlements = (networkId?: string) => {
  return useQuery({
    queryKey: ['settlements', networkId],
    queryFn: async () => {
      let query = supabase.from('settlegara_settlements').select('*');
      
      if (networkId) {
        query = query.eq('network_id', networkId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Settlement[];
    },
    enabled: !!networkId,
  });
};

export const useCreateSettlement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settlement: CreateSettlement) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('settlegara_settlements')
        .insert({
          ...settlement,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', data.network_id] });
    },
  });
};

export const useCompleteSettlement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settlementId: string) => {
      const { data, error } = await supabase
        .from('settlegara_settlements')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', settlementId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', data.network_id] });
    },
  });
};
