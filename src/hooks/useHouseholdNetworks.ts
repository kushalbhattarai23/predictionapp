import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Network } from '@/hooks/useSettleBillNetworks';

export interface HouseholdNetwork extends Network {
  network_type: string;
}

export const useHouseholdNetworks = () => {
  return useQuery({
    queryKey: ['household-networks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlegara_networks')
        .select('*')
        .eq('network_type', 'household')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HouseholdNetwork[];
    },
  });
};
