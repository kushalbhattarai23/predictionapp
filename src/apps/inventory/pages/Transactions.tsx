import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ArrowUpDown } from 'lucide-react';
import { useInventoryTransactions, useInventoryItems } from '@/hooks/useInventory';
import { format } from 'date-fns';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  added: { label: 'Added', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  consumed: { label: 'Consumed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  adjusted: { label: 'Adjusted', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  transferred: { label: 'Transferred', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
};

const InventoryTransactions: React.FC = () => {
  const { transactions, addTransaction } = useInventoryTransactions();
  const { items } = useInventoryItems();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item_id: '', transaction_type: 'added', quantity_change: 0, notes: '' });

  const activeItems = items.filter(i => !i.is_archived);

  const handleSubmit = () => {
    if (!form.item_id || form.quantity_change === 0) return;
    const qty = form.transaction_type === 'consumed' ? -Math.abs(form.quantity_change) : Math.abs(form.quantity_change);
    addTransaction.mutate({ ...form, quantity_change: qty, notes: form.notes || undefined });
    setShowForm(false);
    setForm({ item_id: '', transaction_type: 'added', quantity_change: 0, notes: '' });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Stock Transactions</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> Log Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Stock Transaction</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Item</Label>
                <Select value={form.item_id} onValueChange={v => setForm({ ...form, item_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>{activeItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Type</Label>
                <Select value={form.transaction_type} onValueChange={v => setForm({ ...form, transaction_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="added">Stock Added</SelectItem>
                    <SelectItem value="consumed">Stock Consumed</SelectItem>
                    <SelectItem value="adjusted">Stock Adjusted</SelectItem>
                    <SelectItem value="transferred">Stock Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Quantity</Label><Input type="number" value={form.quantity_change} onChange={e => setForm({ ...form, quantity_change: +e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90">Log Transaction</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty Change</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <ArrowUpDown className="h-8 w-8 mx-auto mb-2 opacity-50" />No transactions yet
                </TableCell></TableRow>
              ) : transactions.map(tx => {
                const typeInfo = TYPE_LABELS[tx.transaction_type] || { label: tx.transaction_type, color: '' };
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">{format(new Date(tx.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="font-medium text-foreground">{(tx.item as any)?.name || '—'}</TableCell>
                    <TableCell><Badge className={typeInfo.color}>{typeInfo.label}</Badge></TableCell>
                    <TableCell className={`text-right font-bold ${tx.quantity_change > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {tx.quantity_change > 0 ? '+' : ''}{tx.quantity_change}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.notes || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryTransactions;
