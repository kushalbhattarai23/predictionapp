
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface UniverseShow {
  id: string;
  show_id: string;
  universe_id: string;
  created_at: string;
  show?: {
    id: string;
    title: string;
    description?: string;
    poster_url?: string;
    is_public: boolean;
  };
}

export interface Show {
  id: string;
  title: string;
  description?: string;
  poster_url?: string;
  is_public: boolean;
  slug?: string;
  created_at: string;
  updated_at: string;
}

export const useUniverseShows = (universeId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: universeShows = [], isLoading } = useQuery({
    queryKey: ['universe-shows', universeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('show_universes')
        .select(`
          *,
          show:shows(*)
        `)
        .eq('universe_id', universeId);
        
      if (error) throw error;
      return data as UniverseShow[];
    },
    enabled: !!universeId
  });

  const { data: availableShows = [] } = useQuery({
    queryKey: ['available-shows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('is_public', true)
        .order('title');
        
      if (error) throw error;
      return data as Show[];
    }
  });

  const addShowToUniverse = useMutation({
    mutationFn: async (showId: string) => {
      console.log(`Attempting to add show ${showId} to universe ${universeId} by user ${user?.id}`);
      const { data, error } = await supabase
        .from('show_universes')
        .insert({
          show_id: showId,
          universe_id: universeId
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error adding show to universe:', error);
        throw error;
      }
      console.log('Show added to universe successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('onSuccess for addShowToUniverse', data);
      queryClient.invalidateQueries({ queryKey: ['universe-shows', universeId] });
      queryClient.invalidateQueries({ queryKey: ['universe-episodes', universeId] });
      toast({ title: 'Show added to universe successfully' });
    },
    onError: (error: Error) => {
      console.error('onError for addShowToUniverse', error);
      toast({ title: 'Error adding show to universe', description: error.message, variant: 'destructive' });
    }
  });

  const removeShowFromUniverse = useMutation({
    mutationFn: async (showUniverseId: string) => {
      console.log(`Attempting to remove show_universe link ${showUniverseId} by user ${user?.id}`);
      const { error } = await supabase
        .from('show_universes')
        .delete()
        .eq('id', showUniverseId);
        
      if (error) {
        console.error('Error removing show from universe:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universe-shows', universeId] });
      queryClient.invalidateQueries({ queryKey: ['universe-episodes', universeId] });
      toast({ title: 'Show removed from universe successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error removing show from universe', description: error.message, variant: 'destructive' });
    }
  });

  return {
    universeShows,
    availableShows,
    isLoading,
    addShowToUniverse,
    removeShowFromUniverse
  };
};
