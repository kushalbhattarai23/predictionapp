
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShowUniverseData {
  universe_id: string;
  universe_name: string;
  universe_description: string;
  show_id: string;
  show_title: string;
  show_description: string;
  poster_url: string;
  slug: string;
  is_public: boolean;
  episode_id: string;
  episode_title: string;
  season_number: number;
  episode_number: number;
  air_date: string;
}

export const useShowUniverseData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['show-universe-data'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_show_universe_data');
      
      if (error) {
        console.error('Error fetching show universe data:', error);
        throw error;
      }
      
      return data as ShowUniverseData[];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    data: data || [],
    isLoading,
    error
  };
};
