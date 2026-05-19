import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useHouseholdRecurringExpenses, useCreateRecurringExpense, useDeleteRecurringExpense } from '@/hooks/useHouseholdRecurring';
import { useLogHouseholdActivity } from '@/hooks/useHouseholdActivity';
import { NetworkMember } from '@/hooks/useSettleBillNetworks';
import { HouseholdCategory } from '@/hooks/useHouseholdCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { Plus, Repeat, Trash2, Calendar, Play } from 'lucide-react';
import { format, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  networkId: string;
  members: NetworkMember[];
  categories: HouseholdCategory[];
}

export const RecurringExpenses: React.FC<Props> = ({ networkId, members, categories }) => {
  const { data: recurring, isLoading } = useHouseholdRecurringExpenses(networkId);
  const createRecurring = useCreateRecurringExpense();
  const deleteRecurring = useDeleteRecurringExpense();
  const logActivity = useLogHouseholdActivity();
  const { formatAmount, currency } = useCurrency();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', amount: '', frequency: 'monthly', next_due_date: '', paid_by_member_id: '', category_id: '', auto_generate: false,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await createRecurring.mutateAsync({
        network_id: networkId,
        title: form.title,
        amount: parseFloat(form.amount),
        currency: currency.code,
        frequency: form.frequency,
        next_due_date: form.next_due_date,
        paid_by_member_id: form.paid_by_member_id || null,
        category_id: form.category_id || null,
        auto_generate: form.auto_generate,
        split_type: 'equal',
        is_active: true,
        created_by: user.id,
      });

      logActivity.mutate({
        network_id: networkId,
        actor_name: user.email || 'User',
        actor_email: user.email || null,
        action_type: 'recurring_created',
        description: `Added recurring expense "${form.title}" (${form.frequency})`,
        metadata: {},
      });

      toast.success('Recurring expense created');
      setShowAdd(false);
      setForm({ title: '', amount: '', frequency: 'monthly', next_due_date: '', paid_by_member_id: '', category_id: '', auto_generate: false });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExecute = async (exp: any) => {
    setExecutingId(exp.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const activeMembers = members.filter(m => m.status === 'active');
      if (activeMembers.length === 0) throw new Error('No active members');

      const totalAmount = Number(exp.amount);
      const splitAmount = totalAmount / activeMembers.length;

      // Create the bill
      const { data: bill, error: billError } = await supabase
        .from('settlegara_bills')
        .insert({
          network_id: networkId,
          title: exp.title,
          total_amount: totalAmount,
          paid_by: exp.paid_by_member_id,
          created_by: user.id,
          currency: exp.currency || currency.code,
          status: 'active',
          source_app: 'household',
          description: exp.category_id ? `Category: ${categories.find(c => c.id === exp.category_id)?.name}` : null,
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create splits
      const splits = activeMembers.map(m => ({
        bill_id: bill.id,
        member_id: m.id,
        amount: splitAmount,
        status: m.id === exp.paid_by_member_id ? 'paid' : 'unpaid',
      }));

      const { error: splitError } = await supabase.from('settlegara_bill_splits').insert(splits);
      if (splitError) throw splitError;

      // Advance next_due_date
      const currentDue = new Date(exp.next_due_date);
      let nextDue: Date;
      switch (exp.frequency) {
        case 'weekly': nextDue = addWeeks(currentDue, 1); break;
        case 'quarterly': nextDue = addQuarters(currentDue, 1); break;
        case 'yearly': nextDue = addYears(currentDue, 1); break;
        default: nextDue = addMonths(currentDue, 1);
      }

      await supabase
        .from('household_recurring_expenses')
        .update({ next_due_date: format(nextDue, 'yyyy-MM-dd'), last_generated_at: new Date().toISOString() })
        .eq('id', exp.id);

      // Log activity
      logActivity.mutate({
        network_id: networkId,
        actor_name: user.email || 'User',
        actor_email: user.email || null,
        action_type: 'expense_added',
        description: `Executed recurring "${exp.title}" (${formatAmount(totalAmount)})`,
        metadata: { bill_id: bill.id, recurring_id: exp.id },
      });

      queryClient.invalidateQueries({ queryKey: ['household-bills', networkId] });
      queryClient.invalidateQueries({ queryKey: ['household-recurring', networkId] });
      toast.success(`Bill created from "${exp.title}"`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExecutingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecurring.mutateAsync({ id, networkId });
      toast.success('Recurring expense deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getMemberName = (id: string | null) => members.find(m => m.id === id)?.user_name || 'Unassigned';
  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || '';

  const frequencyLabel: Record<string, string> = {
    weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Repeat className="h-5 w-5 text-sky-600" /> Recurring Expenses
        </h2>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Add Recurring
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : recurring && recurring.length > 0 ? (
        <div className="grid gap-3">
          {recurring.map(exp => (
            <Card key={exp.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="font-medium flex items-center gap-2">
                    {exp.title}
                    <Badge variant="outline">{frequencyLabel[exp.frequency] || exp.frequency}</Badge>
                    {exp.auto_generate && <Badge variant="secondary">Auto</Badge>}
                    {!exp.auto_generate && <Badge variant="outline">Reminder</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatAmount(Number(exp.amount))} · {getMemberName(exp.paid_by_member_id)}
                    {exp.category_id && ` · ${getCategoryName(exp.category_id)}`}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Next: {format(new Date(exp.next_due_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-sky-700 border-sky-200 hover:bg-sky-50 dark:text-sky-300 dark:border-sky-800 dark:hover:bg-sky-950"
                    onClick={() => handleExecute(exp)}
                    disabled={executingId === exp.id}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {executingId === exp.id ? 'Creating...' : 'Execute'}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="text-center py-8 text-muted-foreground">
            No recurring expenses set up yet
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recurring Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Next Due Date *</Label>
              <Input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Default Payer</Label>
              <Select value={form.paid_by_member_id} onValueChange={(v) => setForm({ ...form, paid_by_member_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.user_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto-generate bills</Label>
              <Switch checked={form.auto_generate} onCheckedChange={(v) => setForm({ ...form, auto_generate: v })} />
            </div>
            <Button type="submit" className="w-full" disabled={createRecurring.isPending}>
              {createRecurring.isPending ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
