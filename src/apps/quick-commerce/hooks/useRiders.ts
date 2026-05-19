import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Rider {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  status: string;
  vehicle_type: string;
  created_at: string;
  updated_at: string;
}

export interface RiderLocation {
  id: string;
  rider_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}

export const useRiders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: riders = [], isLoading } = useQuery({
    queryKey: ['riders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Rider[];
    },
    enabled: !!user,
  });

  const addRider = useMutation({
    mutationFn: async (rider: { name: string; phone?: string; vehicle_type?: string }) => {
      const { data, error } = await supabase
        .from('riders')
        .insert({ ...rider, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Rider added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRider = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Rider> & { id: string }) => {
      const { error } = await supabase
        .from('riders')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Rider updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRider = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('riders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Rider deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { riders, isLoading, addRider, updateRider, deleteRider };
};

export const useRiderLocations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['rider-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rider_locations')
        .select('*');
      if (error) throw error;
      return data as unknown as RiderLocation[];
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const updateLocation = useMutation({
    mutationFn: async ({ rider_id, lat, lng }: { rider_id: string; lat: number; lng: number }) => {
      // Upsert based on rider_id
      const { data: existing } = await supabase
        .from('rider_locations')
        .select('id')
        .eq('rider_id', rider_id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('rider_locations')
          .update({ lat, lng, updated_at: new Date().toISOString() } as any)
          .eq('rider_id', rider_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rider_locations')
          .insert({ rider_id, lat, lng } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-locations'] });
    },
  });

  return { locations, isLoading, updateLocation };
};
