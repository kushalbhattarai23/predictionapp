
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateAppNotification } from '@/hooks/useCreateAppNotification';
import { useAuth } from '@/hooks/useAuth';

export interface Movie {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  release_year: number | null;
  director: string | null;
  duration_minutes: number | null;
  poster_url: string | null;
  rating: number | null;
  user_id: string;
  status: string;
  watched_at: string | null;
  user_rating: number | null;
  user_notes: string | null;
  slug: string | null;
  is_public: boolean;
  rewatch_count: number;
  is_favorite: boolean;
  runtime_minutes: number | null;
  overview: string | null;
  created_at: string;
  updated_at: string;
}

export const useMovies = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['movies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Movie[];
    },
    enabled: !!user,
  });
};

export const usePublicMovies = () => {
  return useQuery({
    queryKey: ['public-movies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Movie[];
    },
  });
};

export const useMovie = (id: string | undefined) => {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      if (!id) throw new Error('No movie ID');
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Movie;
    },
    enabled: !!id,
  });
};

export const useCreateMovie = () => {
  const queryClient = useQueryClient();
  const { notify } = useCreateAppNotification();
  
  return useMutation({
    mutationFn: async (movie: Partial<Movie>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('movies')
        .insert({
          title: movie.title || 'Untitled',
          description: movie.description || null,
          genre: movie.genre || null,
          release_year: movie.release_year || null,
          director: movie.director || null,
          duration_minutes: movie.duration_minutes || null,
          poster_url: movie.poster_url || null,
          rating: movie.rating || null,
          status: movie.status || 'want_to_watch',
          watched_at: movie.watched_at || null,
          user_rating: movie.user_rating || null,
          user_notes: movie.user_notes || null,
          slug: movie.slug || null,
          is_public: movie.is_public || false,
          rewatch_count: movie.rewatch_count || 0,
          is_favorite: movie.is_favorite || false,
          runtime_minutes: movie.runtime_minutes || null,
          overview: movie.overview || null,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      notify('movie_added', '🎬 Movie Added', `"${data.title}" was added to your collection`, { link: `/movies/${data.id}` });
    },
  });
};

export const useUpdateMovie = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Movie> & { id: string }) => {
      const { data, error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['movie'] });
      queryClient.invalidateQueries({ queryKey: ['movie-universe-items'] });
      queryClient.invalidateQueries({ queryKey: ['public-movies'] });
    },
  });
};

export const useDeleteMovie = () => {
  const queryClient = useQueryClient();
  const { notify } = useCreateAppNotification();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      notify('movie_deleted', '🗑️ Movie Deleted', 'A movie was removed from your collection', { link: '/movies' });
    },
  });
};
