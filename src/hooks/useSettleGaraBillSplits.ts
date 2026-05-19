
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BillSplit {
  id: string;
  bill_id: string;
  member_id: string;
  amount: number;
  status: string;
  created_at: string;
  settled_at: string | null;
  settled_by: string | null;
}

export interface BillSplitWithDetails extends BillSplit {
  member_name?: string;
  bill_title?: string;
  payer_name?: string;
}

export const useBillSplits = (billId: string) => {
  return useQuery({
    queryKey: ['bill-splits', billId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlegara_bill_splits')
        .select('*')
        .eq('bill_id', billId);
      
      if (error) throw error;
      return data as BillSplit[];
    },
    enabled: !!billId,
  });
};

export const useNetworkBillSplits = (networkId: string) => {
  return useQuery({
    queryKey: ['network-bill-splits', networkId],
    queryFn: async () => {
      // Get all bills for this network with their splits and member details
      const { data: bills, error: billsError } = await supabase
        .from('settlegara_bills')
        .select('id, title, paid_by, total_amount')
        .eq('network_id', networkId)
        .eq('source_app', 'settlebill');
      
      if (billsError) throw billsError;
      if (!bills || bills.length === 0) return [];

      const billIds = bills.map(b => b.id);
      
      // Get all splits for these bills
      const { data: splits, error: splitsError } = await supabase
        .from('settlegara_bill_splits')
        .select('*')
        .in('bill_id', billIds);
      
      if (splitsError) throw splitsError;

      // Get all members for this network
      const { data: members, error: membersError } = await supabase
        .from('settlegara_network_members')
        .select('id, user_name')
        .eq('network_id', networkId);
      
      if (membersError) throw membersError;

      const memberMap = new Map(members?.map(m => [m.id, m.user_name]) || []);
      const billMap = new Map(bills.map(b => [b.id, { title: b.title, paid_by: b.paid_by }]));

      // Combine splits with member and bill details
      return (splits || []).map(split => ({
        ...split,
        member_name: memberMap.get(split.member_id) || 'Unknown',
        bill_title: billMap.get(split.bill_id)?.title || 'Unknown Bill',
        payer_name: memberMap.get(billMap.get(split.bill_id)?.paid_by || '') || 'Unknown',
        payer_id: billMap.get(split.bill_id)?.paid_by
      })) as (BillSplitWithDetails & { payer_id?: string })[];
    },
    enabled: !!networkId,
  });
};

export const useCreateBillSplit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (split: Omit<BillSplit, 'id' | 'created_at' | 'settled_at' | 'settled_by'>) => {
      const { data, error } = await supabase
        .from('settlegara_bill_splits')
        .insert(split)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bill-splits', data.bill_id] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['network-bill-splits'] });
    },
  });
};

export const useUpdateBillSplit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BillSplit> & { id: string }) => {
      const { data, error } = await supabase
        .from('settlegara_bill_splits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bill-splits', data.bill_id] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['network-bill-splits'] });
    },
  });
};

export const useMarkSplitAsPaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (splitId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('settlegara_bill_splits')
        .update({
          status: 'paid',
          settled_at: new Date().toISOString(),
          settled_by: user.id
        })
        .eq('id', splitId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bill-splits', data.bill_id] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['network-bill-splits'] });
    },
  });
};

export const useMarkMultipleSplitsAsPaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (splitIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('settlegara_bill_splits')
        .update({
          status: 'paid',
          settled_at: new Date().toISOString(),
          settled_by: user.id
        })
        .in('id', splitIds)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-splits'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['network-bill-splits'] });
    },
  });
};

export const useMarkSplitAsUnpaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (splitId: string) => {
      const { data, error } = await supabase
        .from('settlegara_bill_splits')
        .update({
          status: 'unpaid',
          settled_at: null,
          settled_by: null
        })
        .eq('id', splitId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bill-splits', data.bill_id] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['network-bill-splits'] });
    },
  });
};
