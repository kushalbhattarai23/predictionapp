import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAppNotifications } from '@/hooks/useAppNotifications';

export interface ScheduledPayment {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  wallet_id: string | null;
  to_wallet_id: string | null;
  category_id: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_date: string;
  is_active: boolean;
  reminder_enabled: boolean;
  notes: string | null;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledPaymentData {
  name: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  wallet_id?: string;
  to_wallet_id?: string;
  category_id?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_date: string;
  is_active?: boolean;
  reminder_enabled?: boolean;
  notes?: string;
}


const normalizeScheduledPaymentPayload = <T extends CreateScheduledPaymentData | (Partial<ScheduledPayment> & { id?: string })>(payload: T) => {
  const normalized = {
    ...payload,
    wallet_id: payload.wallet_id || null,
    to_wallet_id: payload.to_wallet_id || null,
    category_id: payload.category_id || null,
    notes: payload.notes?.trim() ? payload.notes : null,
  } as T & {
    wallet_id: string | null;
    to_wallet_id: string | null;
    category_id: string | null;
    notes: string | null;
  };

  if (normalized.type !== 'transfer') {
    normalized.to_wallet_id = null;
  }

  return normalized;
};

export const useScheduledPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createNotification } = useAppNotifications();

  const { data: scheduledPayments = [], isLoading, error } = useQuery({
    queryKey: ['scheduled-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('scheduled_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('next_date', { ascending: true });

      if (error) throw error;
      return data as ScheduledPayment[];
    },
    enabled: !!user?.id,
  });

  const createScheduledPayment = useMutation({
    mutationFn: async (paymentData: CreateScheduledPaymentData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const payload = normalizeScheduledPaymentPayload(paymentData);

      const { data, error } = await supabase
        .from('scheduled_payments')
        .insert({
          ...payload,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
      toast({ title: 'Scheduled payment created successfully' });
      
      // Create notification for the scheduled payment
      createNotification.mutate({
        type: 'scheduled_payment',
        title: '📅 Scheduled Payment Created',
        message: `New ${data.frequency} ${data.type} scheduled: ${data.name} for ${data.amount}`,
        metadata: { payment_id: data.id, amount: data.amount, frequency: data.frequency, link: '/finance/scheduled-payments' }
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating scheduled payment', description: error.message, variant: 'destructive' });
    },
  });

  const updateScheduledPayment = useMutation({
    mutationFn: async ({ id, ...paymentData }: Partial<ScheduledPayment> & { id: string }) => {
      const payload = normalizeScheduledPaymentPayload(paymentData);

      const { data, error } = await supabase
        .from('scheduled_payments')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
      toast({ title: 'Scheduled payment updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating scheduled payment', description: error.message, variant: 'destructive' });
    },
  });

  const deleteScheduledPayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
      toast({ title: 'Scheduled payment deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting scheduled payment', description: error.message, variant: 'destructive' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('scheduled_payments')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
      toast({ title: data.is_active ? 'Payment activated' : 'Payment paused' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating payment status', description: error.message, variant: 'destructive' });
    },
  });

  return {
    scheduledPayments,
    isLoading,
    error,
    createScheduledPayment,
    updateScheduledPayment,
    deleteScheduledPayment,
    toggleActive,
  };
};
