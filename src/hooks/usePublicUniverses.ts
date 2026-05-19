
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicUniverse {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  creator_id: string;
  slug?: string;
  created_at: string;
  updated_at: string;
}

export const usePublicUniverses = () => {
  const { data: publicUniverses = [], isLoading } = useQuery({
    queryKey: ['public-universes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('universes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as PublicUniverse[];
    }
  });

  return {
    publicUniverses,
    isLoading
  };
};
