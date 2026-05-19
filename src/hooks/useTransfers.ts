import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useCreateAppNotification } from '@/hooks/useCreateAppNotification';

export interface Transfer {
  id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  date: string;
  description?: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  from_wallet?: { name: string };
  to_wallet?: { name: string };
}

export const useTransfers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentOrganization, isPersonalMode } = useOrganizationContext();
  const { notify } = useCreateAppNotification();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers', user?.id, currentOrganization?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get wallets for the current context to filter transfers
      let walletQuery = supabase.from('wallets').select('id');
      
      if (isPersonalMode) {
        walletQuery = walletQuery.eq('user_id', user.id).is('organization_id', null);
      } else if (currentOrganization) {
        walletQuery = walletQuery.eq('organization_id', currentOrganization.id);
      }
      
      const { data: wallets, error: walletsError } = await walletQuery;
      
      if (walletsError) {
        console.error('Error fetching wallets for transfer filtering:', walletsError);
        throw walletsError;
      }
      
      const walletIds = wallets?.map(w => w.id) || [];
      
      if (walletIds.length === 0) {
        return [];
      }
      
      // Now get transfers that involve these wallets
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          from_wallet:wallets!from_wallet_id(name),
          to_wallet:wallets!to_wallet_id(name)
        `)
        .or(`from_wallet_id.in.(${walletIds.join(',')}),to_wallet_id.in.(${walletIds.join(',')})`)
        .order('date', { ascending: false });
        
      if (error) {
        console.error('Error fetching transfers:', error);
        throw error;
      }
      return data as Transfer[];
    },
    enabled: !!user
  });

  const createTransfer = useMutation({
    mutationFn: async (transfer: Omit<Transfer, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'>) => {
      if (!user) throw new Error('User not authenticated');
      
      // Get wallet balances
      const { data: fromWallet, error: fromWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', transfer.from_wallet_id)
        .single();
      
      if (fromWalletError) throw fromWalletError;
      
      if (fromWallet.balance < transfer.amount) {
        throw new Error('Insufficient balance in source wallet');
      }

      const { data: toWallet, error: toWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', transfer.to_wallet_id)
        .single();
      
      if (toWalletError) throw toWalletError;
      
      // Create the transfer (without organization_id as it doesn't exist in the table)
      const transferData = {
        ...transfer,
        user_id: user.id,
        status: 'completed'
      };
      
      const { data, error } = await supabase
        .from('transfers')
        .insert(transferData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update wallet balances
      await Promise.all([
        supabase
          .from('wallets')
          .update({ balance: fromWallet.balance - transfer.amount })
          .eq('id', transfer.from_wallet_id),
        supabase
          .from('wallets')
          .update({ balance: toWallet.balance + transfer.amount })
          .eq('id', transfer.to_wallet_id)
      ]);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Transfer completed successfully - wallet balances updated' });
      notify('transfer_created', '🔄 Transfer Completed', `Transfer of ${data.amount} completed`, { link: '/finance/transfers' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating transfer', description: error.message, variant: 'destructive' });
    }
  });

  const updateTransfer = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transfer> & { id: string }) => {
      // Get the original transfer to reverse its effect
      const { data: originalTransfer, error: originalError } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', id)
        .single();
        
      if (originalError) throw originalError;

      // Get current wallet balances
      const { data: fromWallet, error: fromWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', originalTransfer.from_wallet_id)
        .single();
      
      if (fromWalletError) throw fromWalletError;

      const { data: toWallet, error: toWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', originalTransfer.to_wallet_id)
        .single();
      
      if (toWalletError) throw toWalletError;
      
      // Reverse the original transfer's effect on wallet balances
      await Promise.all([
        supabase
          .from('wallets')
          .update({ balance: fromWallet.balance + originalTransfer.amount })
          .eq('id', originalTransfer.from_wallet_id),
        supabase
          .from('wallets')
          .update({ balance: toWallet.balance - originalTransfer.amount })
          .eq('id', originalTransfer.to_wallet_id)
      ]);
      
      // Update the transfer
      const { data, error } = await supabase
        .from('transfers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Apply the new transfer's effect on wallet balances if amount/wallets changed
      if (updates.amount && updates.from_wallet_id && updates.to_wallet_id) {
        // Get updated wallet balances for new wallets
        const { data: newFromWallet, error: newFromError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('id', updates.from_wallet_id)
          .single();
        
        if (newFromError) throw newFromError;

        const { data: newToWallet, error: newToError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('id', updates.to_wallet_id)
          .single();
        
        if (newToError) throw newToError;

        await Promise.all([
          supabase
            .from('wallets')
            .update({ balance: newFromWallet.balance - updates.amount })
            .eq('id', updates.from_wallet_id),
          supabase
            .from('wallets')
            .update({ balance: newToWallet.balance + updates.amount })
            .eq('id', updates.to_wallet_id)
        ]);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Transfer updated successfully - wallet balances updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating transfer', description: error.message, variant: 'destructive' });
    }
  });

  const deleteTransfer = useMutation({
    mutationFn: async (id: string) => {
      // Get the transfer to reverse its effect
      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', id)
        .single();
        
      if (transferError) throw transferError;

      // Get current wallet balances
      const { data: fromWallet, error: fromWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', transfer.from_wallet_id)
        .single();
      
      if (fromWalletError) throw fromWalletError;

      const { data: toWallet, error: toWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', transfer.to_wallet_id)
        .single();
      
      if (toWalletError) throw toWalletError;
      
      // Reverse the transfer's effect on wallet balances
      await Promise.all([
        supabase
          .from('wallets')
          .update({ balance: fromWallet.balance + transfer.amount })
          .eq('id', transfer.from_wallet_id),
        supabase
          .from('wallets')
          .update({ balance: toWallet.balance - transfer.amount })
          .eq('id', transfer.to_wallet_id)
      ]);
      
      // Delete the transfer
      const { error } = await supabase
        .from('transfers')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Transfer deleted successfully - wallet balances updated' });
      notify('transfer_deleted', '🗑️ Transfer Deleted', 'A transfer was deleted', { link: '/finance/transfers' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting transfer', description: error.message, variant: 'destructive' });
    }
  });

  return {
    transfers,
    isLoading,
    createTransfer,
    updateTransfer,
    deleteTransfer
  };
};
