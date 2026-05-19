
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Network {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface NetworkMember {
  id: string;
  network_id: string;
  user_name: string;
  user_email: string;
  nickname?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useNetworks = () => {
  return useQuery({
    queryKey: ['settlegara-networks'],
    queryFn: async (): Promise<Network[]> => {
      const { data, error } = await (supabase as any)
        .from('settlegara_networks')
        .select('*')
        .neq('network_type', 'household')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useNetworkMembers = (networkId: string) => {
  return useQuery({
    queryKey: ['settlegara-network-members', networkId],
    queryFn: async (): Promise<NetworkMember[]> => {
      if (!networkId) return [];
      
      const { data, error } = await (supabase as any)
        .from('settlegara_network_members')
        .select('*')
        .eq('network_id', networkId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!networkId,
  });
};

export const useCreateNetwork = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (networkData: { name: string; description: string }): Promise<Network> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('settlegara_networks')
        .insert({
          ...networkData,
          creator_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;

      // Add creator as admin member
      const { error: memberError } = await (supabase as any)
        .from('settlegara_network_members')
        .insert({
          network_id: data.id,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          user_email: user.email,
          role: 'admin',
          status: 'active'
        });

      if (memberError) {
        console.error('Error adding creator as member:', memberError);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlegara-networks'] });
      queryClient.invalidateQueries({ queryKey: ['settlegara-network-members', data.id] });
    },
  });
};

export const useAddNetworkMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberData: Omit<NetworkMember, 'id' | 'created_at' | 'updated_at'>): Promise<NetworkMember> => {
      const { data, error } = await (supabase as any)
        .from('settlegara_network_members')
        .insert(memberData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settlegara-network-members', variables.network_id] });
    },
  });
};

export const useRemoveNetworkMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, networkId }: { memberId: string; networkId: string }) => {
      const { error } = await (supabase as any)
        .from('settlegara_network_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      return { memberId, networkId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlegara-network-members', data.networkId] });
    },
  });
};
