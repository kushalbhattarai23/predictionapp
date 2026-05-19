import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Calendar, CheckCircle, CalendarClock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { convertEnglishToNepali, formatNepaliDate } from '@/utils/dateConverter';
import { useScheduledPayments } from '@/hooks/useScheduledPayments';
import { useScheduledPaymentExecution } from '@/hooks/useScheduledPaymentExecution';

export const ToolsPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { scheduledPayments } = useScheduledPayments();
  const { executeDuePayments } = useScheduledPaymentExecution();

  // Nepali date update mutation
  const updateNepaliDatesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, date, nepali_date')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const toUpdate = (transactions || []).filter(t => !t.nepali_date && t.date);
      let updatedCount = 0;

      for (const t of toUpdate) {
        const englishDate = new Date(t.date);
        const nepali = convertEnglishToNepali(englishDate);
        const nepaliDateStr = formatNepaliDate(nepali.year, nepali.month, nepali.day);

        const { error: updateError } = await supabase
          .from('transactions')
          .update({ nepali_date: nepaliDateStr })
          .eq('id', t.id);

        if (!updateError) updatedCount++;
      }

      return { updatedCount, totalChecked: transactions?.length || 0 };
    },
    onSuccess: (data) => {
      toast({
        title: 'Nepali dates updated',
        description: `Updated ${data.updatedCount} out of ${data.totalChecked} transactions.`,
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const duePayments = (scheduledPayments || []).filter(
    p => p.is_active && p.next_date <= today && p.wallet_id
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-700">Tools</h1>
        <p className="text-muted-foreground">Execute batch operations on your data</p>
      </div>

      {/* Update Nepali Dates */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Calendar className="h-5 w-5" />
            Update Nepali Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan all your transactions and fill in missing Nepali dates by converting from the English date.
          </p>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => updateNepaliDatesMutation.mutate()}
              disabled={updateNepaliDatesMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updateNepaliDatesMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Execute</>
              )}
            </Button>
            {updateNepaliDatesMutation.isSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Updated {updateNepaliDatesMutation.data?.updatedCount} transactions
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Execute Scheduled Payments */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CalendarClock className="h-5 w-5" />
            Execute Scheduled Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Execute all due scheduled payments at once. Currently <strong>{duePayments.length}</strong> payment(s) due.
          </p>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => executeDuePayments.mutate(scheduledPayments || [])}
              disabled={executeDuePayments.isPending || duePayments.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {executeDuePayments.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Executing...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Execute Due ({duePayments.length})</>
              )}
            </Button>
          </div>
          {duePayments.length > 0 && (
            <div className="space-y-2">
              {duePayments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 border border-green-200 rounded text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className={p.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {p.type === 'income' ? '+' : '-'}रु {p.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolsPage;
