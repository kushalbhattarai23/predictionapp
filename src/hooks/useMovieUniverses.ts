
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface MovieUniverse {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  is_public: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface MovieUniverseItem {
  id: string;
  universe_id: string;
  movie_id: string;
  timeline_order: number;
  created_at: string;
  movie?: {
    id: string;
    title: string;
    poster_url: string | null;
    release_year: number | null;
    genre: string | null;
    status: string;
    user_rating: number | null;
    watched_at: string | null;
  };
}

export const useMovieUniverses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: universes = [], isLoading } = useQuery({
    queryKey: ['movie-universes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('movie_universes')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MovieUniverse[];
    },
    enabled: !!user,
  });

  const createUniverse = useMutation({
    mutationFn: async (universe: { name: string; description?: string; is_public?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const slug = universe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data, error } = await supabase
        .from('movie_universes')
        .insert({ ...universe, creator_id: user.id, slug })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-universes'] });
      toast({ title: 'Movie universe created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating universe', description: error.message, variant: 'destructive' });
    },
  });

  const updateUniverse = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MovieUniverse> & { id: string }) => {
      const { data, error } = await supabase
        .from('movie_universes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-universes'] });
      toast({ title: 'Universe updated' });
    },
  });

  const deleteUniverse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movie_universes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-universes'] });
      toast({ title: 'Universe deleted' });
    },
  });

  return { universes, isLoading, createUniverse, updateUniverse, deleteUniverse };
};

export const usePublicMovieUniverses = () => {
  return useQuery({
    queryKey: ['public-movie-universes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_universes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MovieUniverse[];
    },
  });
};

export const useMovieUniverseItems = (universeId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['movie-universe-items', universeId],
    queryFn: async () => {
      if (!universeId) return [];
      const { data, error } = await supabase
        .from('movie_universe_items')
        .select('*, movie:movies(*)')
        .eq('universe_id', universeId)
        .order('timeline_order', { ascending: true });
      if (error) throw error;
      return data as MovieUniverseItem[];
    },
    enabled: !!universeId,
  });

  const addMovie = useMutation({
    mutationFn: async ({ movieId, timelineOrder }: { movieId: string; timelineOrder?: number }) => {
      if (!universeId) throw new Error('No universe ID');
      const { data, error } = await supabase
        .from('movie_universe_items')
        .insert({ universe_id: universeId, movie_id: movieId, timeline_order: timelineOrder || 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-universe-items', universeId] });
      toast({ title: 'Movie added to universe' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding movie', description: error.message, variant: 'destructive' });
    },
  });

  const removeMovie = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('movie_universe_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-universe-items', universeId] });
      toast({ title: 'Movie removed from universe' });
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ itemId, timelineOrder }: { itemId: string; timelineOrder: number }) => {
      const { error } = await supabase
        .from('movie_universe_items')
        .update({ timeline_order: timelineOrder })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-universe-items', universeId] });
    },
  });

  return { items, isLoading, addMovie, removeMovie, updateOrder };
};
