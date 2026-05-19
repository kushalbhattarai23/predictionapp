
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useCreateAppNotification } from '@/hooks/useCreateAppNotification';

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  user_id: string;
  organization_id?: string;
  created_at: string;
}

export const useWallets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentOrganization, isPersonalMode } = useOrganizationContext();
  const { notify } = useCreateAppNotification();

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ['wallets', user?.id, currentOrganization?.id, isPersonalMode],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase.from('wallets').select('*');
      
      if (isPersonalMode) {
        // Show only personal wallets (no organization_id)
        query = query.eq('user_id', user.id).is('organization_id', null);
      } else if (currentOrganization) {
        // Show only company wallets for the selected organization
        query = query.eq('organization_id', currentOrganization.id);
      } else {
        // If not personal mode but no organization selected, show nothing
        return [];
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching wallets:', error);
        throw error;
      }
      return data as Wallet[];
    },
    enabled: !!user
  });

  const getWalletById = (walletId: string): Wallet | undefined => {
    return wallets.find(wallet => wallet.id === walletId);
  };

  const createWallet = useMutation({
    mutationFn: async (wallet: Omit<Wallet, 'id' | 'created_at' | 'user_id' | 'organization_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const walletData = {
        ...wallet,
        user_id: user.id,
        organization_id: isPersonalMode ? null : currentOrganization?.id || null
      };
      
      const { data, error } = await supabase
        .from('wallets')
        .insert(walletData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Wallet created successfully' });
      notify('wallet_created', '👛 Wallet Created', `"${data.name}" wallet was created`, { link: '/finance/wallets' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating wallet', description: error.message, variant: 'destructive' });
    }
  });

  const updateWallet = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Wallet> & { id: string }) => {
      const { data, error } = await supabase
        .from('wallets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Wallet updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating wallet', description: error.message, variant: 'destructive' });
    }
  });

  const deleteWallet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Wallet deleted successfully' });
      notify('wallet_deleted', '🗑️ Wallet Deleted', 'A wallet was deleted', { link: '/finance/wallets' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting wallet', description: error.message, variant: 'destructive' });
    }
  });

  return {
    wallets,
    isLoading,
    getWalletById,
    createWallet,
    updateWallet,
    deleteWallet
  };
};
