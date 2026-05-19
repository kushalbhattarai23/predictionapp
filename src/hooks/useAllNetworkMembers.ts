import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MemberNetwork {
  member_id: string;
  network_id: string;
  network_name: string;
  role: string;
  status: string;
}

export interface AllNetworkMember {
  id: string;
  user_email: string;
  user_name: string;
  networks: MemberNetwork[];
}

export const useAllNetworkMembers = () => {
  return useQuery({
    queryKey: ['all-network-members'],
    queryFn: async (): Promise<AllNetworkMember[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all networks the user has access to
      const { data: networks, error: networksError } = await supabase
        .from('settlegara_networks')
        .select('id, name');

      if (networksError) throw networksError;
      if (!networks || networks.length === 0) return [];

      const networkIds = networks.map(n => n.id);
      const networkMap = new Map(networks.map(n => [n.id, n.name]));

      // Get all members from those networks
      const { data: members, error: membersError } = await supabase
        .from('settlegara_network_members')
        .select('*')
        .in('network_id', networkIds);

      if (membersError) throw membersError;

      // Group members by user_name (case-insensitive) with all their networks
      const memberMap = new Map<string, AllNetworkMember>();
      
      (members || []).forEach(member => {
        const key = member.user_name.toLowerCase();
        const networkInfo: MemberNetwork = {
          member_id: member.id,
          network_id: member.network_id,
          network_name: networkMap.get(member.network_id) || 'Unknown Network',
          role: member.role,
          status: member.status
        };

        if (memberMap.has(key)) {
          const existing = memberMap.get(key)!;
          // Check if this network is already added
          if (!existing.networks.some(n => n.network_id === member.network_id)) {
            existing.networks.push(networkInfo);
          }
        } else {
          memberMap.set(key, {
            id: member.id,
            user_email: member.user_email,
            user_name: member.user_name,
            networks: [networkInfo]
          });
        }
      });

      return Array.from(memberMap.values()).sort((a, b) => 
        a.user_name.localeCompare(b.user_name)
      );
    },
  });
};
