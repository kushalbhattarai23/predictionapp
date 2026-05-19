import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SharedUniverse {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  visibility: 'public' | 'private';
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedUniverseMedia {
  id: string;
  universe_id: string;
  media_type: 'movie' | 'tv_show';
  media_id: string;
  timeline_order: number;
  phase: string | null;
  notes: string | null;
  created_at: string;
  // Joined data
  movie?: {
    id: string;
    title: string;
    poster_url: string | null;
    release_year: number | null;
    genre: string | null;
    status: string;
    user_rating: number | null;
    runtime_minutes: number | null;
    duration_minutes: number | null;
  };
  show?: {
    id: string;
    title: string;
    poster_url: string | null;
    description: string | null;
    is_public: boolean;
  };
}

export const useSharedUniverses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: universes = [], isLoading } = useQuery({
    queryKey: ['shared-universes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('shared_universes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as SharedUniverse[];
    },
    enabled: !!user,
  });

  const createUniverse = useMutation({
    mutationFn: async (input: { title: string; description?: string; visibility?: string; cover_image?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('shared_universes')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-universes'] });
      toast({ title: 'Shared universe created' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateUniverse = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SharedUniverse> & { id: string }) => {
      const { data, error } = await supabase
        .from('shared_universes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-universes'] });
      toast({ title: 'Universe updated' });
    },
  });

  const deleteUniverse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shared_universes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-universes'] });
      toast({ title: 'Universe deleted' });
    },
  });

  return { universes, isLoading, createUniverse, updateUniverse, deleteUniverse };
};

export const usePublicSharedUniverses = () => {
  return useQuery({
    queryKey: ['public-shared-universes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_universes')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SharedUniverse[];
    },
  });
};

export const useSharedUniverseMedia = (universeId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ['shared-universe-media', universeId],
    queryFn: async () => {
      if (!universeId) return [];
      const { data, error } = await supabase
        .from('shared_universe_media')
        .select('*')
        .eq('universe_id', universeId)
        .order('timeline_order', { ascending: true });
      if (error) throw error;

      // Fetch movie and show data separately
      const movieIds = data.filter(d => d.media_type === 'movie').map(d => d.media_id);
      const showIds = data.filter(d => d.media_type === 'tv_show').map(d => d.media_id);

      let movies: any[] = [];
      let shows: any[] = [];

      if (movieIds.length > 0) {
        const { data: movieData } = await supabase
          .from('movies')
          .select('id, title, poster_url, release_year, genre, status, user_rating, runtime_minutes, duration_minutes')
          .in('id', movieIds);
        movies = movieData || [];
      }

      if (showIds.length > 0) {
        const { data: showData } = await supabase
          .from('shows')
          .select('id, title, poster_url, description, is_public')
          .in('id', showIds);
        shows = showData || [];
      }

      return data.map(item => ({
        ...item,
        movie: item.media_type === 'movie' ? movies.find(m => m.id === item.media_id) : undefined,
        show: item.media_type === 'tv_show' ? shows.find(s => s.id === item.media_id) : undefined,
      })) as SharedUniverseMedia[];
    },
    enabled: !!universeId,
  });

  const addMedia = useMutation({
    mutationFn: async (input: { media_type: 'movie' | 'tv_show'; media_id: string; timeline_order?: number; phase?: string; notes?: string }) => {
      if (!universeId) throw new Error('No universe ID');
      const { data, error } = await supabase
        .from('shared_universe_media')
        .insert({ universe_id: universeId, ...input, timeline_order: input.timeline_order ?? mediaItems.length })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-universe-media', universeId] });
      toast({ title: 'Media added to universe' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shared_universe_media').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-universe-media', universeId] });
      toast({ title: 'Media removed' });
    },
  });

  const updateMedia = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; timeline_order?: number; phase?: string; notes?: string }) => {
      const { error } = await supabase
        .from('shared_universe_media')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-universe-media', universeId] });
    },
  });

  return { mediaItems, isLoading, addMedia, removeMedia, updateMedia };
};
