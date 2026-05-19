import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useCreateAppNotification } from '@/hooks/useCreateAppNotification';

export interface InventoryStore {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  household_id: string | null;
  organization_id: string | null;
  store_id: string | null;
  name: string;
  category_id: string | null;
  quantity: number;
  unit: string;
  min_stock: number;
  purchase_price: number;
  location: string | null;
  expiry_date: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  category?: InventoryCategory | null;
  store?: InventoryStore | null;
}

export interface InventoryCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  user_id: string;
  transaction_type: 'added' | 'consumed' | 'adjusted' | 'transferred';
  quantity_change: number;
  notes: string | null;
  created_at: string;
  item?: InventoryItem;
}

// Stores hook
export const useInventoryStores = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useCreateAppNotification();

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['inventory-stores', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_stores')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');
      if (error) throw error;
      return data as unknown as InventoryStore[];
    },
    enabled: !!user,
  });

  const addStore = useMutation({
    mutationFn: async (store: { name: string; address?: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from('inventory_stores')
        .insert({ ...store, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-stores'] });
      toast.success('Store created');
      notify('inventory_store_created', '🏪 Store Created', `"${data.name}" store was created`, { link: '/inventory/stores' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStore = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; address?: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from('inventory_stores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-stores'] });
      toast.success('Store updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteStore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_stores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-stores'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Store deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { stores, isLoading, addStore, updateStore, deleteStore };
};

// Items hook
export const useInventoryItems = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useCreateAppNotification();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory-items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items_tracker')
        .select('*, category:inventory_categories(*), store:inventory_stores(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as InventoryItem[];
    },
    enabled: !!user,
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'store'>) => {
      const { data, error } = await supabase
        .from('inventory_items_tracker')
        .insert({ ...item, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Log transaction
      await supabase.from('inventory_transactions').insert({
        item_id: data.id,
        user_id: user!.id,
        transaction_type: 'added',
        quantity_change: item.quantity,
        notes: 'Initial stock',
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      toast.success('Item added successfully');
      notify('inventory_item_added', '📦 Item Added', `"${data.name}" was added to inventory`, { link: '/inventory/items' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_items_tracker')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Item updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items_tracker').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Item deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { items, isLoading, addItem, updateItem, deleteItem };
};

// Categories hook
export const useInventoryCategories = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['inventory-categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');
      if (error) throw error;
      return data as unknown as InventoryCategory[];
    },
    enabled: !!user,
  });

  const addCategory = useMutation({
    mutationFn: async (cat: { name: string; color?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .insert({ ...cat, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast.success('Category added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast.success('Category updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast.success('Category deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { categories, isLoading, addCategory, updateCategory, deleteCategory };
};

// Transactions hook
export const useInventoryTransactions = (itemId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useCreateAppNotification();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['inventory-transactions', user?.id, itemId],
    queryFn: async () => {
      let query = supabase
        .from('inventory_transactions')
        .select('*, item:inventory_items_tracker(name, unit)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (itemId) query = query.eq('item_id', itemId);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as InventoryTransaction[];
    },
    enabled: !!user,
  });

  const addTransaction = useMutation({
    mutationFn: async (tx: { item_id: string; transaction_type: string; quantity_change: number; notes?: string }) => {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .insert({ ...tx, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Update item quantity
      const { data: item } = await supabase
        .from('inventory_items_tracker')
        .select('quantity')
        .eq('id', tx.item_id)
        .single();

      if (item) {
        const newQty = Number(item.quantity) + tx.quantity_change;
        await supabase
          .from('inventory_items_tracker')
          .update({ quantity: Math.max(0, newQty) })
          .eq('id', tx.item_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      toast.success('Stock updated');
      notify('inventory_stock_updated', '📊 Stock Updated', 'Inventory stock was updated', { link: '/inventory/transactions' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { transactions, isLoading, addTransaction };
};
