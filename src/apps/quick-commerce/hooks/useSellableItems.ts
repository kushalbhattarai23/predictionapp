import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SellableItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  discount_price: number | null;
  product_description: string | null;
  product_images: string[];
  product_tags: string[];
  available_for_delivery: boolean;
  max_order_quantity: number;
  category_id: string | null;
  store_id: string | null;
  category?: { id: string; name: string; color: string } | null;
  store?: { id: string; name: string; color: string } | null;
}

export const useSellableItems = () => {
  const { user } = useAuth();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['sellable-items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items_tracker')
        .select('*, category:inventory_categories(*), store:inventory_stores(*)')
        .eq('user_id', user!.id)
        .eq('is_sellable', true)
        .eq('is_archived', false)
        .gt('quantity', 0)
        .order('name');
      if (error) throw error;
      return data as unknown as SellableItem[];
    },
    enabled: !!user,
  });

  return { items, isLoading };
};
