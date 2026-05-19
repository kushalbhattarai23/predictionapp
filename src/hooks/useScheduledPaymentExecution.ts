import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAppNotifications } from '@/hooks/useAppNotifications';
import { ScheduledPayment } from '@/hooks/useScheduledPayments';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export const useScheduledPaymentExecution = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createNotification } = useAppNotifications();

  const calculateNextDate = (currentDate: string, frequency: string): string => {
    const date = new Date(currentDate);
    let nextDate: Date;

    switch (frequency) {
      case 'daily':
        nextDate = addDays(date, 1);
        break;
      case 'weekly':
        nextDate = addWeeks(date, 1);
        break;
      case 'monthly':
        nextDate = addMonths(date, 1);
        break;
      case 'yearly':
        nextDate = addYears(date, 1);
        break;
      default:
        nextDate = addMonths(date, 1);
    }

    return nextDate.toISOString().split('T')[0];
  };

  const executeScheduledPayment = useMutation({
    mutationFn: async (payment: ScheduledPayment) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!payment.wallet_id) throw new Error('No wallet selected for this scheduled payment');
      if (payment.type === 'transfer' && !payment.to_wallet_id) {
        throw new Error('No destination wallet selected for this scheduled transfer');
      }
      if (payment.type === 'transfer' && payment.wallet_id === payment.to_wallet_id) {
        throw new Error('From and to wallets must be different for transfers');
      }

      let executionRecord: any;

      if (payment.type === 'transfer') {
        const { data: fromWallet, error: fromWalletError } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('id', payment.wallet_id)
          .single();

        if (fromWalletError) throw fromWalletError;
        if (fromWallet.balance < payment.amount) {
          throw new Error('Insufficient balance in source wallet');
        }

        const { data: toWallet, error: toWalletError } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('id', payment.to_wallet_id)
          .single();

        if (toWalletError) throw toWalletError;

      const { data: transfer, error: transferError } = await supabase
          .from('transfers')
          .insert({
            from_wallet_id: payment.wallet_id,
            to_wallet_id: payment.to_wallet_id,
            amount: payment.amount,
            date: new Date().toISOString().split('T')[0],
            description: `${payment.name} (Scheduled Transfer)`,
            status: 'completed',
            user_id: user.id,
          })
          .select()
          .single();

        if (transferError) throw transferError;

        const [deductResult, addResult] = await Promise.all([
          supabase
            .from('wallets')
            .update({ balance: fromWallet.balance - payment.amount })
            .eq('id', fromWallet.id),
          supabase
            .from('wallets')
            .update({ balance: toWallet.balance + payment.amount })
            .eq('id', toWallet.id),
        ]);

        if (deductResult.error) throw deductResult.error;
        if (addResult.error) throw addResult.error;

        executionRecord = transfer;
      } else {
        const transactionData = {
          user_id: user.id,
          wallet_id: payment.wallet_id,
          category_id: payment.category_id || null,
          type: payment.type,
          reason: `${payment.name} (Scheduled)`,
          date: new Date().toISOString().split('T')[0],
          income: payment.type === 'income' ? payment.amount : null,
          expense: payment.type === 'expense' ? payment.amount : null,
        };

        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .insert(transactionData)
          .select()
          .single();

        if (transactionError) throw transactionError;
        executionRecord = transaction;
      }

      // Calculate next execution date
      const nextDate = calculateNextDate(payment.next_date, payment.frequency);

      // Update the scheduled payment with new next_date and last_executed_at
      const { error: updateError } = await supabase
        .from('scheduled_payments')
        .update({
          next_date: nextDate,
          last_executed_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      return { executionRecord, nextDate };
    },
    onSuccess: (data, payment) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });

      const amount = payment.amount.toLocaleString();
      toast({
        title: payment.type === 'transfer' ? 'Scheduled Transfer Executed' : 'Scheduled Payment Executed',
        description: payment.type === 'transfer'
          ? `${payment.name}: ${amount} moved between wallets`
          : `${payment.name}: ${payment.type === 'income' ? '+' : '-'}${amount}`,
      });

      // Create notification
      createNotification.mutate({
        type: 'scheduled_payment_executed',
        title: `📅 Scheduled ${payment.type === 'income' ? 'Income' : payment.type === 'expense' ? 'Payment' : 'Transfer'} Executed`,
        message: payment.type === 'transfer'
          ? `${payment.name}: ${amount} moved from one wallet to another`
          : `${payment.name}: ${payment.type === 'income' ? '+' : '-'}${amount} has been added to your wallet`,
        metadata: {
          payment_id: payment.id,
          amount: payment.amount,
          type: payment.type,
          wallet_id: payment.wallet_id,
          to_wallet_id: payment.to_wallet_id,
        },
      });
    },
    onError: (error: any, payment) => {
      toast({
        title: 'Failed to execute scheduled payment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const executeDuePayments = useMutation({
    mutationFn: async (payments: ScheduledPayment[]) => {
      const today = new Date().toISOString().split('T')[0];
      const duePayments = payments.filter(
        (p) => p.is_active && p.next_date <= today && p.wallet_id
      );

      const results = [];
      for (const payment of duePayments) {
        try {
          await executeScheduledPayment.mutateAsync(payment);
          results.push({ payment, success: true });
        } catch (error) {
          results.push({ payment, success: false, error });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        toast({
          title: 'Due Payments Executed',
          description: `Successfully executed ${successCount} scheduled payment(s)`,
        });
      }
    },
  });

  return {
    executeScheduledPayment,
    executeDuePayments,
    calculateNextDate,
  };
};
