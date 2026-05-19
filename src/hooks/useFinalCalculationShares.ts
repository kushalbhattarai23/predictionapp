import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FinalCalculationSharePayload {
  networkName: string;
  calculationDate: string;
  imageUrls?: string[];
  memberAvatars?: Record<string, string>;
  currencyCode?: string;
  currencySymbol?: string;
  finalAmountRows: Array<{
    member: string;
    itemsOrdered: string;
    itemsSubtotal: number;
    discountShare?: number;
    finalAmount: number;
  }>;
  breakdownRows: Array<{
    member: string;
    payable: number;
    receivable: number;
    net: number;
  }>;
  settlementRows: Array<{
    from: string;
    to: string;
    amount: number;
    paid?: boolean;
    paidAt?: string;
    paidBy?: string;
  }>;
  totals: {
    totalPayable: number;
    totalReceivable: number;
  };
}

interface FinalCalculationShare {
  id: string;
  share_id: string;
  network_id: string;
  payload: FinalCalculationSharePayload;
  created_at: string;
}

const createShareId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const useCreateFinalCalculationShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ networkId, payload }: { networkId: string; payload: FinalCalculationSharePayload }) => {
      const shareId = createShareId();

      const { data, error } = await supabase
        .from('settlegara_final_calculation_shares')
        .insert({
          network_id: networkId,
          share_id: shareId,
          payload: payload as any,
        })
        .select('*')
        .single();

      if (error) throw error;

      return data as unknown as FinalCalculationShare;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['public-final-calculation-share', data.share_id], data);
      queryClient.invalidateQueries({ queryKey: ['network-final-calculation-shares', variables.networkId] });
      queryClient.invalidateQueries({ queryKey: ['all-final-calculation-shares'] });
    },
  });
};

export const usePublicFinalCalculationShare = (shareId: string) => {
  return useQuery({
    queryKey: ['public-final-calculation-share', shareId],
    enabled: !!shareId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlegara_final_calculation_shares')
        .select('id, share_id, network_id, payload, created_at')
        .eq('share_id', shareId)
        .single();

      if (error) throw error;

      return data as unknown as FinalCalculationShare;
    },
  });
};

export const useNetworkFinalCalculationShares = (networkId: string) => {
  return useQuery({
    queryKey: ['network-final-calculation-shares', networkId],
    enabled: !!networkId,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlegara_final_calculation_shares')
        .select('*')
        .eq('network_id', networkId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as FinalCalculationShare[];
    },
  });
};

export interface AllFinalCalculationShare {
  id: string;
  share_id: string;
  network_id: string;
  network_name: string;
  payload: FinalCalculationSharePayload;
  created_at: string;
}

export const useAllFinalCalculationShares = () => {
  return useQuery({
    queryKey: ['all-final-calculation-shares'],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async (): Promise<AllFinalCalculationShare[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all networks the user has access to (RLS will handle filtering)
      const { data: networks, error: networksError } = await supabase
        .from('settlegara_networks')
        .select('id, name');

      if (networksError) throw networksError;
      if (!networks || networks.length === 0) return [];

      const networkMap = new Map(networks.map(n => [n.id, n.name]));
      const networkIds = networks.map(n => n.id);

      const { data: shares, error: sharesError } = await supabase
        .from('settlegara_final_calculation_shares')
        .select('*')
        .in('network_id', networkIds)
        .order('created_at', { ascending: false });

      if (sharesError) throw sharesError;

      return (shares || []).map((s: any) => ({
        id: s.id,
        share_id: s.share_id,
        network_id: s.network_id,
        network_name: networkMap.get(s.network_id) || 'Unknown Network',
        payload: s.payload,
        created_at: s.created_at,
      }));
    },
  });
};

export const useUpdateFinalCalculationShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      networkId,
      payload,
    }: {
      id: string;
      networkId: string;
      payload: FinalCalculationSharePayload;
    }) => {
      const { data, error } = await supabase
        .from('settlegara_final_calculation_shares')
        .update({ payload: payload as any })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return { share: data as unknown as FinalCalculationShare, networkId };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['public-final-calculation-share', result.share.share_id], result.share);
      queryClient.invalidateQueries({ queryKey: ['network-final-calculation-shares', result.networkId] });
      queryClient.invalidateQueries({ queryKey: ['all-final-calculation-shares'] });
      queryClient.invalidateQueries({ queryKey: ['public-final-calculation-share', result.share.share_id] });
    },
  });
};

export const useDeleteFinalCalculationShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, networkId }: { id: string; networkId: string }) => {
      const { error } = await supabase
        .from('settlegara_final_calculation_shares')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { networkId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['network-final-calculation-shares', result.networkId] });
      queryClient.invalidateQueries({ queryKey: ['all-final-calculation-shares'] });
    },
  });
};
