import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface StoreLocation {
  id: string;
  user_id: string;
  store_id: string | null;
  name: string;
  lat: number;
  lng: number;
  delivery_radius_km: number;
  created_at: string;
  updated_at: string;
}

export const useStoreLocations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: storeLocations = [], isLoading } = useQuery({
    queryKey: ['store-locations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_locations')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');
      if (error) throw error;
      return data as unknown as StoreLocation[];
    },
    enabled: !!user,
  });

  const addStoreLocation = useMutation({
    mutationFn: async (loc: { name: string; lat: number; lng: number; delivery_radius_km?: number; store_id?: string }) => {
      const { data, error } = await supabase
        .from('store_locations')
        .insert({ ...loc, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-locations'] });
      toast.success('Store location added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStoreLocation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StoreLocation> & { id: string }) => {
      const { error } = await supabase
        .from('store_locations')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-locations'] });
      toast.success('Store location updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteStoreLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('store_locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-locations'] });
      toast.success('Store location deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { storeLocations, isLoading, addStoreLocation, updateStoreLocation, deleteStoreLocation };
};

// Delivery eligibility check
export const checkDeliveryEligibility = (
  storeLat: number,
  storeLng: number,
  customerLat: number,
  customerLng: number,
  radiusKm: number = 3
) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((customerLat - storeLat) * Math.PI) / 180;
  const dLng = ((customerLng - storeLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((storeLat * Math.PI) / 180) *
      Math.cos((customerLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return {
    distance: Math.round(distance * 100) / 100,
    eligible: distance <= radiusKm,
    estimatedTime: distance <= radiusKm ? Math.max(5, Math.round(distance * 3.33)) : null,
  };
};
