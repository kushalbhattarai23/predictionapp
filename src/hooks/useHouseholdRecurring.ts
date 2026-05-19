import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HouseholdRecurringExpense {
  id: string;
  network_id: string;
  title: string;
  amount: number;
  currency: string;
  category_id: string | null;
  frequency: string;
  next_due_date: string;
  last_generated_at: string | null;
  paid_by_member_id: string | null;
  split_type: string;
  auto_generate: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useHouseholdRecurringExpenses = (networkId: string) => {
  return useQuery({
    queryKey: ['household-recurring', networkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('household_recurring_expenses')
        .select('*')
        .eq('network_id', networkId)
        .order('next_due_date');

      if (error) throw error;
      return data as HouseholdRecurringExpense[];
    },
    enabled: !!networkId,
  });
};

export const useCreateRecurringExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<HouseholdRecurringExpense, 'id' | 'created_at' | 'updated_at' | 'last_generated_at'>) => {
      const { data, error } = await supabase
        .from('household_recurring_expenses')
        .insert(expense)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['household-recurring', data.network_id] });
    },
  });
};

export const useUpdateRecurringExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, networkId, ...updates }: { id: string; networkId: string } & Partial<HouseholdRecurringExpense>) => {
      const { data, error } = await supabase
        .from('household_recurring_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, networkId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['household-recurring', data.networkId] });
    },
  });
};

export const useDeleteRecurringExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, networkId }: { id: string; networkId: string }) => {
      const { error } = await supabase
        .from('household_recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return networkId;
    },
    onSuccess: (networkId) => {
      queryClient.invalidateQueries({ queryKey: ['household-recurring', networkId] });
    },
  });
};
