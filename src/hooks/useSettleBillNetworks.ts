import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Network {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface NetworkMember {
  id: string;
  network_id: string;
  user_email: string;
  user_name: string;
  role: string;
  status: string;
  joined_at: string;
}

export const useNetworks = () => {
  return useQuery({
    queryKey: ['settlebill-networks'],
    queryFn: async () => {
      console.log('Fetching SettleBill networks...');
      const { data, error } = await supabase
        .from('settlegara_networks')
        .select('*')
        .neq('network_type', 'household')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching SettleBill networks:', error);
        throw error;
      }
      
      console.log('SettleBill networks fetched successfully:', data);
      return data as Network[];
    },
  });
};

export const useNetworkMembers = (networkId: string) => {
  return useQuery({
    queryKey: ['settlebill-network-members', networkId],
    queryFn: async () => {
      console.log('Fetching network members for SettleBill network:', networkId);
      const { data, error } = await supabase
        .from('settlegara_network_members')
        .select('*')
        .eq('network_id', networkId);
      
      if (error) {
        console.error('Error fetching SettleBill network members:', error);
        throw error;
      }
      
      console.log('SettleBill network members fetched successfully:', data);
      return data as NetworkMember[];
    },
    enabled: !!networkId,
  });
};

export const useCreateNetwork = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (network: Omit<Network, 'id' | 'created_at' | 'updated_at' | 'creator_id'>) => {
      console.log('Creating SettleBill network mutation started...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        throw new Error('Not authenticated');
      }

      console.log('User authenticated, creating SettleBill network:', { ...network, creator_id: user.id });
      
      const { data, error } = await supabase
        .from('settlegara_networks')
        .insert({
          ...network,
          creator_id: user.id
        })
        .select()
        .single();
      
      if (error) {
        console.error('SettleBill network creation error:', error);
        throw error;
      }
      
      console.log('SettleBill network created successfully:', data);

      // Add the creator as the first member (admin role)
      const { error: memberError } = await supabase
        .from('settlegara_network_members')
        .insert({
          network_id: data.id,
          user_email: user.email!,
          user_name: user.user_metadata?.full_name || user.email!.split('@')[0],
          role: 'admin',
          status: 'active'
        });

      if (memberError) {
        console.error('Error adding creator as member:', memberError);
        // Don't fail the whole operation if this fails
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('SettleBill network creation success, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['settlebill-networks'] });
      queryClient.invalidateQueries({ queryKey: ['settlebill-network-members', data.id] });
    },
    onError: (error) => {
      console.error('SettleBill network creation failed:', error);
    },
  });
};

export const useUpdateNetwork = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Network> & { id: string }) => {
      const { data, error } = await supabase
        .from('settlegara_networks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlebill-networks'] });
    },
  });
};

export const useDeleteNetwork = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (networkId: string) => {
      const { error } = await supabase
        .from('settlegara_networks')
        .delete()
        .eq('id', networkId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlebill-networks'] });
    },
  });
};

export const useAddNetworkMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (member: Omit<NetworkMember, 'id' | 'joined_at'>) => {
      console.log('Adding network member...', member);
      const { data, error } = await supabase
        .from('settlegara_network_members')
        .insert(member)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding network member:', error);
        throw error;
      }
      
      console.log('Network member added successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlebill-network-members', data.network_id] });
    },
  });
};

export const useRemoveNetworkMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, networkId }: { memberId: string; networkId: string }) => {
      const { error } = await supabase
        .from('settlegara_network_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      return { memberId, networkId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlebill-network-members', data.networkId] });
    },
  });
};

export const useUpdateNetworkMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, networkId, ...updates }: { id: string; networkId: string; user_name?: string; user_email?: string }) => {
      const { data, error } = await supabase
        .from('settlegara_network_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, networkId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlebill-network-members', data.networkId] });
      queryClient.invalidateQueries({ queryKey: ['all-network-members'] });
      queryClient.invalidateQueries({ queryKey: ['network-bill-splits'] });
    },
  });
};
