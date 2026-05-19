import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';
import { useScheduledPayments, ScheduledPayment, CreateScheduledPaymentData } from '@/hooks/useScheduledPayments';
import { useScheduledPaymentExecution } from '@/hooks/useScheduledPaymentExecution';
import {
  Calendar,
  Plus,
  Clock,
  Repeat,
  Trash2,
  Edit2,
  DollarSign,
  Bell,
  BellOff,
  CheckCircle2,
  Loader2,
  Play,
  PlayCircle,
  ArrowRightLeft,
} from 'lucide-react';

const defaultFrequency = 'monthly' as const;

type PaymentType = CreateScheduledPaymentData['type'];

export const ScheduledPayments: React.FC = () => {
  const { wallets } = useWallets();
  const { categories } = useCategories();
  const {
    scheduledPayments,
    isLoading,
    createScheduledPayment,
    updateScheduledPayment,
    deleteScheduledPayment,
    toggleActive,
  } = useScheduledPayments();
  const { executeScheduledPayment, executeDuePayments } = useScheduledPaymentExecution();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ScheduledPayment | null>(null);
  const [formData, setFormData] = useState<CreateScheduledPaymentData>({
    name: '',
    amount: 0,
    type: 'expense',
    wallet_id: '',
    to_wallet_id: '',
    category_id: '',
    frequency: defaultFrequency,
    next_date: new Date().toISOString().split('T')[0],
    is_active: true,
    reminder_enabled: true,
    notes: '',
  });

  const handleOpenDialog = (payment?: ScheduledPayment, forcedType?: PaymentType) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        name: payment.name,
        amount: payment.amount,
        type: payment.type,
        wallet_id: payment.wallet_id || '',
        to_wallet_id: payment.to_wallet_id || '',
        category_id: payment.category_id || '',
        frequency: payment.frequency,
        next_date: payment.next_date,
        is_active: payment.is_active,
        reminder_enabled: payment.reminder_enabled,
        notes: payment.notes || '',
      });
    } else {
      const selectedType = forcedType || 'expense';
      setEditingPayment(null);
      setFormData({
        name: '',
        amount: 0,
        type: selectedType,
        wallet_id: wallets.length > 0 ? wallets[0].id : '',
        to_wallet_id: selectedType === 'transfer' && wallets.length > 1 ? wallets[1].id : '',
        category_id: '',
        frequency: defaultFrequency,
        next_date: new Date().toISOString().split('T')[0],
        is_active: true,
        reminder_enabled: true,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const isTransfer = formData.type === 'transfer';

  const handleSave = async () => {
    if (!formData.name || formData.amount <= 0 || !formData.wallet_id) return;
    if (isTransfer && (!formData.to_wallet_id || formData.wallet_id === formData.to_wallet_id)) return;

    if (editingPayment) {
      await updateScheduledPayment.mutateAsync({ id: editingPayment.id, ...formData });
    } else {
      await createScheduledPayment.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    setEditingPayment(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this scheduled payment?')) {
      await deleteScheduledPayment.mutateAsync(id);
    }
  };

  const handleExecuteNow = async (payment: ScheduledPayment) => {
    if (!payment.wallet_id || (payment.type === 'transfer' && !payment.to_wallet_id)) {
      alert('Please select wallet details for this scheduled item before executing.');
      return;
    }
    await executeScheduledPayment.mutateAsync(payment);
  };

  const duePayments = scheduledPayments.filter((payment) => {
    const today = new Date().toISOString().split('T')[0];
    return payment.is_active && payment.next_date <= today && payment.wallet_id && (payment.type !== 'transfer' || payment.to_wallet_id);
  });

  const handleExecuteAllDue = async () => {
    if (duePayments.length === 0) {
      alert('No due payments to execute.');
      return;
    }

    if (confirm(`Execute ${duePayments.length} due payment(s)?`)) {
      await executeDuePayments.mutateAsync(duePayments);
    }
  };

  const getFrequencyLabel = (frequency: string) => ({ daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }[frequency] || frequency);

  const getWalletName = (walletId: string | null) => {
    if (!walletId) return 'Not selected';
    return wallets.find((wallet) => wallet.id === walletId)?.name || 'Not selected';
  };

  const upcomingPayments = [...scheduledPayments]
    .filter((payment) => payment.is_active)
    .sort((a, b) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime());

  const isSubmitting = createScheduledPayment.isPending || updateScheduledPayment.isPending;
  const isExecuting = executeScheduledPayment.isPending || executeDuePayments.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700">Scheduled Payments</h1>
          <p className="text-muted-foreground">Manage your recurring transactions and scheduled transfers</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {duePayments.length > 0 && (
            <Button
              onClick={handleExecuteAllDue}
              variant="outline"
              disabled={isExecuting}
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              {isExecuting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
              Execute Due ({duePayments.length})
            </Button>
          )}

          <Button variant="outline" onClick={() => handleOpenDialog(undefined, 'transfer')}>
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Schedule Transfer
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingPayment ? 'Edit Scheduled Payment' : 'New Scheduled Payment'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Payment Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Rent, Savings Transfer" />
                  </div>

                  <div>
                    <Label>Amount *</Label>
                    <Input type="number" step="0.01" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                  </div>

                  <div>
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(value: PaymentType) => setFormData({ ...formData, type: value, category_id: value === 'transfer' ? '' : formData.category_id })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Frequency</Label>
                    <Select value={formData.frequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setFormData({ ...formData, frequency: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Next Date</Label>
                    <Input type="date" value={formData.next_date} onChange={(e) => setFormData({ ...formData, next_date: e.target.value })} />
                  </div>

                  <div>
                    <Label>{isTransfer ? 'From Wallet' : 'Wallet'}</Label>
                    <Select value={formData.wallet_id} onValueChange={(value) => setFormData({ ...formData, wallet_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Select wallet" /></SelectTrigger>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isTransfer && (
                    <div>
                      <Label>To Wallet</Label>
                      <Select value={formData.to_wallet_id || ''} onValueChange={(value) => setFormData({ ...formData, to_wallet_id: value })}>
                        <SelectTrigger><SelectValue placeholder="Select destination wallet" /></SelectTrigger>
                        <SelectContent>
                          {wallets.filter((wallet) => wallet.id !== formData.wallet_id).map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {!isTransfer && (
                    <div>
                      <Label>Category</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes..." />
                  </div>

                  <div className="col-span-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={formData.reminder_enabled} onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })} />
                      <Label>Enable reminders</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                      <Label>Active</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={
                      isSubmitting ||
                      !formData.name ||
                      formData.amount <= 0 ||
                      !formData.wallet_id ||
                      (isTransfer && (!formData.to_wallet_id || formData.to_wallet_id === formData.wallet_id))
                    }
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingPayment ? 'Update' : 'Schedule'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Calendar className="w-8 h-8 text-green-600" /><div><p className="text-sm text-muted-foreground">Total Scheduled</p><p className="text-xl font-bold">{scheduledPayments.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 className="w-8 h-8 text-green-600" /><div><p className="text-sm text-muted-foreground">Active</p><p className="text-xl font-bold">{scheduledPayments.filter((p) => p.is_active).length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="w-8 h-8 text-accent-foreground" /><div><p className="text-sm text-muted-foreground">Upcoming This Week</p><p className="text-xl font-bold">{scheduledPayments.filter((p) => { const nextDate = new Date(p.next_date); const today = new Date(); const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); return p.is_active && nextDate >= today && nextDate <= weekFromNow; }).length}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Repeat className="w-5 h-5" />Scheduled Payments</CardTitle>
          <CardDescription>Your recurring income, expense, and transfer entries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground"><Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" /><p>Loading scheduled payments...</p></div>
          ) : scheduledPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No scheduled payments yet</p><p className="text-sm">Click "Schedule Payment" to add one</p></div>
          ) : (
            <div className="space-y-3">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className={`p-4 rounded-lg border ${payment.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${payment.type === 'income' ? 'bg-green-100 text-green-700' : payment.type === 'transfer' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                        {payment.type === 'transfer' ? <ArrowRightLeft className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{payment.name}</span>
                          {payment.reminder_enabled ? <Bell className="w-4 h-4 text-muted-foreground" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{getFrequencyLabel(payment.frequency)}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{payment.type}</Badge>
                          <span>Next: {new Date(payment.next_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-bold ${payment.type === 'income' ? 'text-green-700' : payment.type === 'transfer' ? 'text-blue-700' : 'text-red-600'}`}>
                          {payment.type === 'income' ? '+' : payment.type === 'expense' ? '-' : ''}{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.type === 'transfer'
                            ? `${getWalletName(payment.wallet_id)} → ${getWalletName(payment.to_wallet_id)}`
                            : getWalletName(payment.wallet_id)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleExecuteNow(payment)} disabled={isExecuting || !payment.wallet_id || (payment.type === 'transfer' && !payment.to_wallet_id)} className="text-green-700 hover:text-green-600" title={payment.wallet_id ? 'Execute now' : 'Select wallet details first'}>
                          {executeScheduledPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Switch checked={payment.is_active} onCheckedChange={() => toggleActive.mutate({ id: payment.id, is_active: !payment.is_active })} />
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(payment)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(payment.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                  {payment.notes && <p className="text-sm text-muted-foreground mt-2 pl-12">{payment.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduledPayments;
