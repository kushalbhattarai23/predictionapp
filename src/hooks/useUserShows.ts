
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserShow {
  id: string;
  title: string;
  description?: string;
  poster_url?: string;
  slug?: string | null;
  totalEpisodes: number;
  watchedEpisodes: number;
  status: 'watching' | 'completed' | 'not_started';
}

export const useUserShows = () => {
  const { user } = useAuth();

  const { data: userShows = [], isLoading } = useQuery({
    queryKey: ['user-shows', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('useUserShows: No user authenticated');
        return [];
      }
      
      try {
        console.log('useUserShows: Fetching shows for user:', user.id);
        
        // First, get tracked show IDs
        const { data: trackedShows } = await supabase
          .from('user_show_tracking')
          .select('show_id')
          .eq('user_id', user.id);

        if (trackedShows && trackedShows.length > 0) {
          console.log('useUserShows: Updating episode counts for tracked shows');
          // Update episode counts for each tracked show in parallel
          await Promise.all(
            trackedShows.map(track =>
              supabase.rpc('update_user_show_episode_counts', {
                p_user_id: user.id,
                p_show_id: track.show_id
              })
            )
          );
        }
        
        // Now get user's tracked shows with updated counts
        const { data: userTrackedShows, error: trackingError } = await supabase
          .from('user_show_tracking')
          .select(`
            show_id,
            total_episodes,
            watched_episodes,
            shows (
              id,
              title,
              description,
              poster_url,
              slug
            )
          `)
          .eq('user_id', user.id);
          
        if (trackingError) {
          console.error('useUserShows: Error fetching tracked shows:', trackingError);
          throw trackingError;
        }
        
        console.log('useUserShows: Raw tracked shows data:', userTrackedShows);
        
        if (!userTrackedShows || userTrackedShows.length === 0) {
          console.log('useUserShows: No tracked shows found');
          return [];
        }

        // Transform the data and add fallback calculation if needed
        const showsWithProgress = await Promise.all(
          userTrackedShows.map(async (item) => {
            const show = item.shows;
            if (!show) {
              console.warn('useUserShows: Missing show data for item:', item);
              return null;
            }

            const totalEpisodes = item.total_episodes || 0;
            const watchedEpisodes = item.watched_episodes || 0;

            console.log(`useUserShows: Show "${show.title}" - Total: ${totalEpisodes}, Watched: ${watchedEpisodes}`);

            // Determine status based on progress
            let status: 'watching' | 'completed' | 'not_started' = 'not_started';
            if (totalEpisodes > 0 && watchedEpisodes === totalEpisodes) {
              status = 'completed';
            } else if (watchedEpisodes > 0) {
              status = 'watching';
            }

            return {
              id: show.id,
              title: show.title,
              description: show.description,
              poster_url: show.poster_url,
              slug: show.slug,
              totalEpisodes,
              watchedEpisodes,
              status
            } as UserShow;
          })
        );

        const validShows = showsWithProgress.filter(Boolean) as UserShow[];
        console.log('useUserShows: Final shows with progress:', validShows);
        return validShows;
        
      } catch (error) {
        console.error('useUserShows: Error fetching user shows:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  console.log('useUserShows: Returning data:', { userShowsCount: userShows.length, isLoading });

  return {
    userShows,
    isLoading
  };
};
