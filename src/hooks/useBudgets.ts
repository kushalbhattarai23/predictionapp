
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useCreateAppNotification } from '@/hooks/useCreateAppNotification';

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  category_id: string;
  user_id: string;
  organization_id?: string;
  created_at: string;
  categories?: {
    name: string;
    color: string;
  };
}

export interface CreateBudgetData {
  category_id: string | null;
  amount: number;
  month: number;
  year: number;
}

export const useBudgets = (month?: number, year?: number) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentOrganization, isPersonalMode } = useOrganizationContext();
  const { notify } = useCreateAppNotification();

  const fetchBudgets = async (): Promise<Budget[]> => {
    if (!user) return [];

    let query = supabase
      .from('budgets')
      .select(`*, categories(name, color)`);

    // Since organization_id column doesn't exist, we'll filter by user_id only
    query = query.eq('user_id', user.id);

    if (month !== undefined) query = query.eq('month', month);
    if (year !== undefined) query = query.eq('year', year);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    }

    return (data || []) as Budget[];
  };

  // Simplified query key to avoid TypeScript issues
  const queryKey = [
    'budgets',
    user?.id || 'no-user',
    month?.toString() || 'no-month',
    year?.toString() || 'no-year'
  ];

  const budgetsQuery = useQuery({
    queryKey,
    queryFn: fetchBudgets,
    enabled: !!user,
  });

  const createBudget = useMutation<Budget, Error, CreateBudgetData>({
    mutationFn: async (budget) => {
      if (!user) throw new Error('User not authenticated');

      const budgetData = {
        ...budget,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert(budgetData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget created successfully' });
      notify('budget_created', '📊 Budget Created', `Budget of ${data.amount} created`, { link: '/finance/budgets' });
    },
    onError: (error) => {
      toast({ title: 'Error creating budget', description: error.message, variant: 'destructive' });
    }
  });

  const updateBudget = useMutation<Budget, Error, Partial<Budget> & { id: string }>({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating budget', description: error.message, variant: 'destructive' });
    }
  });

  const deleteBudget = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget deleted successfully' });
      notify('budget_deleted', '🗑️ Budget Deleted', 'A budget was deleted', { link: '/finance/budgets' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting budget', description: error.message, variant: 'destructive' });
    }
  });

  return {
    budgets: budgetsQuery.data || [],
    isLoading: budgetsQuery.isLoading,
    createBudget,
    updateBudget,
    deleteBudget
  };
};
