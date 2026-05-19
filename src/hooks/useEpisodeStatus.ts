
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useEpisodeStatus = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const toggleWatchStatus = useMutation({
    mutationFn: async ({ episodeId, currentStatus }: { episodeId: string; currentStatus: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      const newStatus = currentStatus ? 'not_watched' : 'watched';
      const watchedAt = currentStatus ? null : new Date().toISOString();

      const { error } = await supabase
        .from('user_episode_status')
        .upsert({
          user_id: user.id,
          episode_id: episodeId,
          status: newStatus,
          watched_at: watchedAt,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,episode_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      return { episodeId, newStatus: newStatus === 'watched' };
    },
    onSuccess: async (data) => {
      // Get the show_id from the episode to update specific show counts
      const { data: episode } = await supabase
        .from('episodes')
        .select('show_id')
        .eq('id', data.episodeId)
        .single();

      if (episode && user) {
        // Update the episode counts for this specific show
        await supabase.rpc('update_user_show_episode_counts', {
          p_user_id: user.id,
          p_show_id: episode.show_id
        });
      }

      // Invalidate and refetch user shows data
      queryClient.invalidateQueries({ queryKey: ['user-shows'] });
      // Also invalidate universe episodes data
      queryClient.invalidateQueries({ queryKey: ['universe-episodes'] });
      
      console.log(`Episode ${data.episodeId} marked as ${data.newStatus ? 'watched' : 'not watched'}`);
    },
    onError: (error) => {
      console.error('Error updating episode status:', error);
    }
  });

  return {
    toggleWatchStatus: toggleWatchStatus.mutate,
    isUpdating: toggleWatchStatus.isPending
  };
};
