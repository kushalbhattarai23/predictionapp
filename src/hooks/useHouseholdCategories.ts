import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HouseholdCategory {
  id: string;
  network_id: string;
  name: string;
  icon: string;
  color: string;
  is_predefined: boolean;
  created_at: string;
}

const PREDEFINED_CATEGORIES = [
  { name: 'Rent', icon: 'Home', color: '#EF4444' },
  { name: 'Electricity', icon: 'Zap', color: '#F59E0B' },
  { name: 'Water', icon: 'Droplets', color: '#3B82F6' },
  { name: 'Internet', icon: 'Wifi', color: '#8B5CF6' },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#10B981' },
  { name: 'Maintenance', icon: 'Wrench', color: '#6B7280' },
  { name: 'Subscriptions', icon: 'CreditCard', color: '#EC4899' },
  { name: 'Miscellaneous', icon: 'MoreHorizontal', color: '#64748B' },
];

export const useHouseholdCategories = (networkId: string) => {
  return useQuery({
    queryKey: ['household-categories', networkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('household_categories')
        .select('*')
        .eq('network_id', networkId)
        .order('is_predefined', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as HouseholdCategory[];
    },
    enabled: !!networkId,
  });
};

export const useInitializeHouseholdCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (networkId: string) => {
      const categories = PREDEFINED_CATEGORIES.map((cat) => ({
        network_id: networkId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_predefined: true,
      }));

      const { data, error } = await supabase
        .from('household_categories')
        .insert(categories)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, networkId) => {
      queryClient.invalidateQueries({ queryKey: ['household-categories', networkId] });
    },
  });
};

export const useCreateHouseholdCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: { network_id: string; name: string; icon?: string; color?: string }) => {
      const { data, error } = await supabase
        .from('household_categories')
        .insert({ ...category, is_predefined: false })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['household-categories', data.network_id] });
    },
  });
};

export const useDeleteHouseholdCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, networkId }: { id: string; networkId: string }) => {
      const { error } = await supabase
        .from('household_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return networkId;
    },
    onSuccess: (networkId) => {
      queryClient.invalidateQueries({ queryKey: ['household-categories', networkId] });
    },
  });
};

export { PREDEFINED_CATEGORIES };
