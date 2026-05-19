
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Universe {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  creator_id: string;
  slug?: string;
  created_at: string;
  updated_at: string;
}

export const useUniverses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: universes = [], isLoading } = useQuery({
    queryKey: ['universes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('universes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as Universe[];
    },
    enabled: !!user
  });

  const createUniverse = useMutation({
    mutationFn: async (universe: Omit<Universe, 'id' | 'created_at' | 'updated_at' | 'creator_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('universes')
        .insert({
          ...universe,
          creator_id: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
      toast({ title: 'Universe created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating universe', description: error.message, variant: 'destructive' });
    }
  });

  const updateUniverse = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Universe> & { id: string }) => {
      const { data, error } = await supabase
        .from('universes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
      toast({ title: 'Universe updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating universe', description: error.message, variant: 'destructive' });
    }
  });

  const deleteUniverse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('universes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
      toast({ title: 'Universe deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting universe', description: error.message, variant: 'destructive' });
    }
  });

  return {
    universes,
    isLoading,
    createUniverse,
    updateUniverse,
    deleteUniverse
  };
};
