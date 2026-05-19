import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CartItem } from './useCart';

export interface QCOrder {
  id: string;
  user_id: string;
  store_location_id: string | null;
  total_amount: number;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  status: string;
  assigned_rider_id: string | null;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface QCOrderItem {
  id: string;
  order_id: string;
  inventory_item_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
}

export const useQCOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['qc-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qc_orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as QCOrder[];
    },
    enabled: !!user,
  });

  const placeOrder = useMutation({
    mutationFn: async (params: {
      items: CartItem[];
      total: number;
      delivery_address: string;
      delivery_lat: number;
      delivery_lng: number;
      payment_method: string;
      store_location_id?: string;
    }) => {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('qc_orders')
        .insert({
          user_id: user!.id,
          total_amount: params.total,
          delivery_address: params.delivery_address,
          delivery_lat: params.delivery_lat,
          delivery_lng: params.delivery_lng,
          payment_method: params.payment_method,
          store_location_id: params.store_location_id || null,
          status: 'pending',
        } as any)
        .select()
        .single();
      if (orderError) throw orderError;

      // Create order items
      const orderItems = params.items.map(item => ({
        order_id: (order as any).id,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        price: item.discount_price ?? item.price,
        subtotal: (item.discount_price ?? item.price) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('qc_order_items')
        .insert(orderItems as any);
      if (itemsError) throw itemsError;

      // Reduce inventory and create transactions
      for (const item of params.items) {
        const { data: invItem } = await supabase
          .from('inventory_items_tracker')
          .select('quantity')
          .eq('id', item.inventory_item_id)
          .single();

        if (invItem) {
          const newQty = Math.max(0, Number(invItem.quantity) - item.quantity);
          await supabase
            .from('inventory_items_tracker')
            .update({ quantity: newQty })
            .eq('id', item.inventory_item_id);

          await supabase.from('inventory_transactions').insert({
            item_id: item.inventory_item_id,
            user_id: user!.id,
            transaction_type: 'sale',
            quantity_change: -item.quantity,
            notes: `Order ${(order as any).id}`,
          } as any);
        }
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      toast.success('Order placed successfully!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('qc_orders')
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-orders'] });
      toast.success('Order status updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { orders, isLoading, placeOrder, updateOrderStatus };
};

export const useQCOrderItems = (orderId?: string) => {
  const { user } = useAuth();

  const { data: orderItems = [], isLoading } = useQuery({
    queryKey: ['qc-order-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qc_order_items')
        .select('*')
        .eq('order_id', orderId!);
      if (error) throw error;
      return data as unknown as QCOrderItem[];
    },
    enabled: !!user && !!orderId,
  });

  return { orderItems, isLoading };
};
