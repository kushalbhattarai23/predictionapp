import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useLogHouseholdActivity } from '@/hooks/useHouseholdActivity';
import { useCreateAppNotification } from '@/hooks/useCreateAppNotification';
import { NetworkMember } from '@/hooks/useSettleBillNetworks';
import { HouseholdCategory } from '@/hooks/useHouseholdCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  networkId: string;
  members: NetworkMember[];
  categories: HouseholdCategory[];
}

type SplitType = 'equal' | 'custom';

export const AddExpenseDialog: React.FC<Props> = ({ open, onOpenChange, networkId, members, categories }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const logActivity = useLogHouseholdActivity();
  const { notify } = useCreateAppNotification();
  const { currency, formatAmount } = useCurrency();

  // Reset custom amounts when members or amount changes
  useEffect(() => {
    if (splitType === 'equal' && selectedMembers.length > 0 && amount) {
      const equalShare = (parseFloat(amount) / selectedMembers.length).toFixed(2);
      const newAmounts: Record<string, string> = {};
      selectedMembers.forEach(id => { newAmounts[id] = equalShare; });
      setCustomAmounts(newAmounts);
    }
  }, [selectedMembers, amount, splitType]);

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(m => m.id));
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const customTotal = Object.entries(customAmounts)
    .filter(([id]) => selectedMembers.includes(id))
    .reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0);

  const totalAmount = parseFloat(amount) || 0;
  const remaining = totalAmount - customTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !paidBy || selectedMembers.length === 0) return;

    if (splitType === 'custom' && Math.abs(remaining) > 0.01) {
      toast.error('Custom split amounts must equal the total');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create bill with source_app = 'household'
      const { data: bill, error: billError } = await supabase
        .from('settlegara_bills')
        .insert({
          network_id: networkId,
          title,
          total_amount: totalAmount,
          paid_by: paidBy,
          created_by: user.id,
          currency: currency.code,
          status: 'active',
          source_app: 'household',
          description: categoryId ? `Category: ${categories.find(c => c.id === categoryId)?.name}` : null,
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create splits based on split type
      const splits = selectedMembers.map(memberId => ({
        bill_id: bill.id,
        member_id: memberId,
        amount: splitType === 'custom'
          ? parseFloat(customAmounts[memberId] || '0')
          : totalAmount / selectedMembers.length,
        status: memberId === paidBy ? 'paid' : 'unpaid',
      }));

      const { error: splitError } = await supabase
        .from('settlegara_bill_splits')
        .insert(splits);

      if (splitError) throw splitError;

      // Log activity
      const payerName = members.find(m => m.id === paidBy)?.user_name || 'Someone';
      logActivity.mutate({
        network_id: networkId,
        actor_name: payerName,
        actor_email: user.email || null,
        action_type: 'expense_added',
        description: `${payerName} added "${title}" (${formatAmount(totalAmount)})`,
        metadata: { bill_id: bill.id, amount: totalAmount },
      });

      notify('household', 'Household Expense Added', `${payerName} added "${title}" (${formatAmount(totalAmount)})`, { link: `/household/${networkId}/ledger` });

      queryClient.invalidateQueries({ queryKey: ['household-bills', networkId] });
      toast.success('Expense added successfully');
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setPaidBy('');
    setCategoryId('');
    setSelectedMembers([]);
    setSplitType('equal');
    setCustomAmounts({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Household Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Expense Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Rent, Groceries" required />
          </div>

          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Paid By *</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger><SelectValue placeholder="Who paid?" /></SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.user_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Split Between *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {members.map(m => (
                <div key={m.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`member-${m.id}`}
                    checked={selectedMembers.includes(m.id)}
                    onCheckedChange={() => toggleMember(m.id)}
                  />
                  <label htmlFor={`member-${m.id}`} className="text-sm">{m.user_name}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Split Type */}
          {selectedMembers.length > 0 && amount && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Distribution</Label>
                <div className="flex gap-1">
                  <Badge
                    variant={splitType === 'equal' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSplitType('equal')}
                  >
                    Equal
                  </Badge>
                  <Badge
                    variant={splitType === 'custom' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSplitType('custom')}
                  >
                    Custom
                  </Badge>
                </div>
              </div>

              {splitType === 'custom' && (
                <div className="space-y-2 rounded-md border p-3">
                  {selectedMembers.map(memberId => {
                    const member = members.find(m => m.id === memberId);
                    return (
                      <div key={memberId} className="flex items-center justify-between gap-2">
                        <span className="text-sm flex-1 truncate">{member?.user_name}</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24 text-right"
                          value={customAmounts[memberId] || ''}
                          onChange={(e) => setCustomAmounts(prev => ({ ...prev, [memberId]: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    );
                  })}
                  <div className={`text-xs text-right font-medium ${Math.abs(remaining) > 0.01 ? 'text-destructive' : 'text-green-600'}`}>
                    {Math.abs(remaining) <= 0.01
                      ? '✓ Amounts match total'
                      : `Remaining: ${formatAmount(remaining)}`}
                  </div>
                </div>
              )}

              {splitType === 'equal' && (
                <p className="text-xs text-muted-foreground">
                  Each person pays: {formatAmount(totalAmount / selectedMembers.length)}
                </p>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading || !title || !amount || !paidBy || selectedMembers.length === 0} className="w-full">
            {loading ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
