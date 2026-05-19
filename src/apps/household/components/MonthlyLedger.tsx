import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NetworkMember } from '@/hooks/useSettleBillNetworks';
import { HouseholdCategory } from '@/hooks/useHouseholdCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { Plus, Calendar, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { AddExpenseDialog } from './AddExpenseDialog';
import { toast } from 'sonner';

interface Props {
  networkId: string;
  members: NetworkMember[];
  categories: HouseholdCategory[];
}

export const MonthlyLedger: React.FC<Props> = ({ networkId, members, categories }) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  const { data: bills } = useQuery({
    queryKey: ['household-bills', networkId, selectedYear, selectedMonth],
    queryFn: async () => {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = selectedMonth === 12
        ? `${selectedYear + 1}-01-01`
        : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;

      const { data, error } = await supabase
        .from('settlegara_bills')
        .select('*, settlegara_bill_splits(*)')
        .eq('network_id', networkId)
        .eq('source_app', 'household')
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!networkId,
  });

  const monthTotal = useMemo(() => {
    return bills?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
  }, [bills]);

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return 'Unknown';
    return members.find(m => m.id === memberId)?.user_name || 'Unknown';
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleDelete = async (billId: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await supabase.from('settlegara_bill_splits').delete().eq('bill_id', billId);
      await supabase.from('settlegara_bills').delete().eq('id', billId);
      queryClient.invalidateQueries({ queryKey: ['household-bills', networkId] });
      toast.success('Expense deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEdit = (bill: any) => {
    setEditingBill(bill);
    setEditTitle(bill.title);
    setEditAmount(String(bill.total_amount));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;
    setEditLoading(true);
    try {
      const newAmount = parseFloat(editAmount);
      const { error } = await supabase
        .from('settlegara_bills')
        .update({ title: editTitle, total_amount: newAmount })
        .eq('id', editingBill.id);
      if (error) throw error;

      // Update splits proportionally
      const splits = editingBill.settlegara_bill_splits || [];
      if (splits.length > 0) {
        const splitAmount = newAmount / splits.length;
        for (const split of splits) {
          await supabase.from('settlegara_bill_splits').update({ amount: splitAmount }).eq('id', split.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['household-bills', networkId] });
      toast.success('Expense updated');
      setEditingBill(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-sky-600" />
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAddExpense(true)} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{months[selectedMonth - 1]} {selectedYear}</CardTitle>
            <Badge variant="secondary" className="text-base px-3 py-1">
              Total: {formatAmount(monthTotal)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {bills && bills.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense</TableHead>
                    <TableHead>Paid By</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Split Between</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => {
                    const splitMembers = bill.settlegara_bill_splits?.map((s: any) => getMemberName(s.member_id)) || [];
                    return (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.title}</TableCell>
                        <TableCell>{getMemberName(bill.paid_by)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatAmount(Number(bill.total_amount))}
                        </TableCell>
                        <TableCell>
                          {splitMembers.length === members.length ? (
                            <Badge variant="outline">All members</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">{splitMembers.join(', ')}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(bill.created_at), 'MMM d')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(bill)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(bill.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No expenses recorded for this month</div>
          )}
        </CardContent>
      </Card>

      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        networkId={networkId}
        members={members}
        categories={categories}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingBill} onOpenChange={(open) => !open && setEditingBill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={editLoading}>
              {editLoading ? 'Updating...' : 'Update Expense'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
