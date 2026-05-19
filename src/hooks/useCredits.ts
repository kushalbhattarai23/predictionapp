
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCreateAppNotification } from '@/hooks/useCreateAppNotification';

export interface Credit {
  id: string;
  name: string;
  person: string;
  phone?: string | null;
  email?: string | null;
  total_amount: number;
  remaining_amount: number;
  description?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreditPayment {
  id: string;
  credit_id: string;
  amount: number;
  payment_date: string;
  description?: string | null;
  created_at: string;
}

export interface CreateCreditData {
  name: string;
  person: string;
  phone?: string;
  email?: string;
  total_amount: number;
  remaining_amount: number;
  description?: string;
}

export interface CreatePaymentData {
  credit_id: string;
  amount: number;
  payment_date: string;
  description?: string;
}

export const useCredits = () => {
  const queryClient = useQueryClient();
  const { notify } = useCreateAppNotification();

  const {
    data: credits = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['credits'],
    queryFn: async () => {
      console.log('Fetching credits...');
      const { data, error } = await supabase
        .from('credits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching credits:', error);
        throw error;
      }
      console.log('Credits fetched:', data);
      return data as Credit[];
    }
  });

  const createCredit = useMutation({
    mutationFn: async (creditData: CreateCreditData) => {
      console.log('Creating credit with data:', creditData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      const insertData = {
        ...creditData,
        user_id: user.id
      };
      
      console.log('Insert data:', insertData);

      const { data, error } = await supabase
        .from('credits')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Create credit error:', error);
        throw error;
      }
      
      console.log('Credit created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      toast.success('Credit created successfully');
      notify('credit_created', '💳 Credit Created', `"${data.name}" credit for ${data.person}`, { link: '/finance/credits' });
    },
    onError: (error) => {
      console.error('Create credit error:', error);
      toast.error('Failed to create credit: ' + error.message);
    }
  });

  const updateCredit = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Credit> & { id: string }) => {
      console.log('Updating credit:', id, updateData);
      
      const { data, error } = await supabase
        .from('credits')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update credit error:', error);
        throw error;
      }
      
      console.log('Credit updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-payments'] });
      toast.success('Credit updated successfully');
    },
    onError: (error) => {
      console.error('Update credit error:', error);
      toast.error('Failed to update credit: ' + error.message);
    }
  });

  const deleteCredit = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting credit:', id);
      
      const { error } = await supabase
        .from('credits')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete credit error:', error);
        throw error;
      }
      
      console.log('Credit deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      toast.success('Credit deleted successfully');
      notify('credit_deleted', '🗑️ Credit Deleted', 'A credit record was deleted', { link: '/finance/credits' });
    },
    onError: (error) => {
      console.error('Delete credit error:', error);
      toast.error('Failed to delete credit: ' + error.message);
    }
  });

  return {
    credits,
    isLoading,
    error,
    createCredit,
    updateCredit,
    deleteCredit
  };
};

export const useCreditPayments = (creditId?: string) => {
  const queryClient = useQueryClient();

  const {
    data: payments = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['credit-payments', creditId],
    queryFn: async () => {
      if (!creditId) return [];
      
      console.log('Fetching payments for credit:', creditId);
      const { data, error } = await supabase
        .from('credit_payments')
        .select('*')
        .eq('credit_id', creditId)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      console.log('Payments fetched:', data);
      return data as CreditPayment[];
    },
    enabled: !!creditId
  });

  const createPayment = useMutation({
    mutationFn: async (paymentData: CreatePaymentData) => {
      console.log('Creating payment with data:', paymentData);

      const { data, error } = await supabase
        .from('credit_payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) {
        console.error('Create payment error:', error);
        throw error;
      }
      
      console.log('Payment created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-payments'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      console.error('Create payment error:', error);
      toast.error('Failed to record payment: ' + error.message);
    }
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting payment:', id);
      
      const { error } = await supabase
        .from('credit_payments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete payment error:', error);
        throw error;
      }
      
      console.log('Payment deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-payments'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      toast.success('Payment deleted successfully');
    },
    onError: (error) => {
      console.error('Delete payment error:', error);
      toast.error('Failed to delete payment: ' + error.message);
    }
  });

  return {
    payments,
    isLoading,
    error,
    createPayment,
    deletePayment
  };
};
