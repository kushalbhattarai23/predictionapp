import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, DollarSign, Phone, Mail, CreditCard, Receipt, Users, ArrowRight } from 'lucide-react';
import { useCredits, CreateCreditData } from '@/hooks/useCredits';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useBills } from '@/hooks/useSettleGaraBills';
import { useNetworks } from '@/hooks/useSettleBillNetworks';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

export const Credits: React.FC = () => {
  const { credits, isLoading, createCredit, updateCredit, deleteCredit } = useCredits();
  const { formatAmount } = useCurrency();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<any>(null);

  const [formData, setFormData] = useState<CreateCreditData>({
    name: '',
    person: '',
    phone: '',
    email: '',
    total_amount: 0,
    remaining_amount: 0,
    description: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      person: '',
      phone: '',
      email: '',
      total_amount: 0,
      remaining_amount: 0,
      description: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCredit) {
        await updateCredit.mutateAsync({
          id: editingCredit.id,
          ...formData
        });
        setIsEditOpen(false);
      } else {
        await createCredit.mutateAsync(formData);
        setIsCreateOpen(false);
      }
      resetForm();
      setEditingCredit(null);
    } catch (error) {
      console.error('Error saving credit:', error);
    }
  };

  const handleEdit = (credit: any) => {
    setEditingCredit(credit);
    setFormData({
      name: credit.name,
      person: credit.person,
      phone: credit.phone || '',
      email: credit.email || '',
      total_amount: credit.total_amount,
      remaining_amount: credit.remaining_amount,
      description: credit.description || ''
    });
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this credit?')) {
      await deleteCredit.mutateAsync(id);
    }
  };

  const sendEmail = (email: string, creditName: string) => {
    const subject = encodeURIComponent(`Credit Payment Reminder - ${creditName}`);
    const body = encodeURIComponent('Hello, this is a friendly reminder about your credit payment. Please let me know when you can make the payment. Thank you!');
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const callPhone = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading credits...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Credits</h1>
          <p className="text-muted-foreground">Manage credits you've given to others</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Credit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Credit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Credit Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Emergency loan to John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="person">Person</Label>
                <Input
                  id="person"
                  value={formData.person}
                  onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                  placeholder="Who received this credit?"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="person@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_amount">Total Amount</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="remaining_amount">Remaining Amount</Label>
                  <Input
                    id="remaining_amount"
                    type="number"
                    step="0.01"
                    value={formData.remaining_amount}
                    onChange={(e) => setFormData({ ...formData, remaining_amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes about this credit"
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Create Credit
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credits.map((credit) => (
          <Card key={credit.id} className="border-green-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-green-700">{credit.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-2">To: {credit.person}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(credit)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(credit.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                <span className="text-sm">
                  {formatAmount(credit.remaining_amount)} / {formatAmount(credit.total_amount)}
                </span>
              </div>
              
              <div className="flex gap-2">
                {credit.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => callPhone(credit.phone!)}
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                )}
                {credit.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendEmail(credit.email!, credit.name)}
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                )}
              </div>
              
              {credit.description && (
                <p className="text-sm text-muted-foreground">{credit.description}</p>
              )}
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${((credit.total_amount - credit.remaining_amount) / credit.total_amount) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {Math.round(((credit.total_amount - credit.remaining_amount) / credit.total_amount) * 100)}% paid
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Credit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Credit Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-person">Person</Label>
              <Input
                id="edit-person"
                value={formData.person}
                onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-total">Total Amount</Label>
                <Input
                  id="edit-total"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-remaining">Remaining Amount</Label>
                <Input
                  id="edit-remaining"
                  type="number"
                  step="0.01"
                  value={formData.remaining_amount}
                  onChange={(e) => setFormData({ ...formData, remaining_amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Update Credit
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pending Settle Bills */}
      <PendingSettleBillsSection />

      {/* Network-wise Member Debts */}
      <NetworkMemberDebtsSection />

      {/* Loan Transactions Section */}
      <LoanTransactionsSection />
    </div>
  );
};

const PendingSettleBillsSection: React.FC = () => {
  const { data: bills, isLoading } = useBills();
  const { formatAmount } = useCurrency();

  const pendingBills = bills?.filter(b => b.status !== 'settled') || [];

  // Fetch unpaid split amounts for all pending bills
  const { data: pendingAmounts } = useQuery({
    queryKey: ['pending-bill-amounts', pendingBills.map(b => b.id)],
    queryFn: async () => {
      if (pendingBills.length === 0) return {};
      const amounts: Record<string, number> = {};
      for (const bill of pendingBills) {
        const { data: splits } = await supabase
          .from('settlegara_bill_splits')
          .select('amount, status, member_id')
          .eq('bill_id', bill.id);
        
        // Sum only unpaid splits, excluding the payer
        const unpaidAmount = (splits || [])
          .filter(s => s.status !== 'paid' && s.member_id !== bill.paid_by)
          .reduce((sum, s) => sum + Number(s.amount), 0);
        amounts[bill.id] = unpaidAmount;
      }
      return amounts;
    },
    enabled: pendingBills.length > 0,
  });

  if (isLoading) return <div className="text-muted-foreground py-4">Loading settle bills...</div>;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-3 text-orange-600 flex items-center gap-2">
        <Receipt className="w-5 h-5" />
        Pending Settle Bills
      </h2>
      {pendingBills.length === 0 ? (
        <div className="text-muted-foreground py-4">No pending bills to settle.</div>
      ) : (
        <div className="space-y-3">
          {pendingBills.map(bill => {
            const pendingAmount = pendingAmounts?.[bill.id] ?? 0;
            return (
              <Link key={bill.id} to={`/settlebill/bills/${bill.id}`}>
                <Card className="border-orange-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{bill.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(bill.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-orange-600">{formatAmount(pendingAmount)}</span>
                        <p className="text-xs text-muted-foreground">of {formatAmount(bill.total_amount)}</p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

const NetworkMemberDebtsSection: React.FC = () => {
  const { data: networks, isLoading: networksLoading } = useNetworks();
  const { formatAmount } = useCurrency();
  const { user } = useAuth();

  // Fetch all bills and splits across all networks
  const { data: allDebts, isLoading: debtsLoading } = useQuery({
    queryKey: ['network-member-debts', networks?.map(n => n.id)],
    queryFn: async () => {
      if (!networks || networks.length === 0) return [];

      const results: Array<{
        networkId: string;
        networkName: string;
        debts: Array<{ from: string; to: string; amount: number }>;
      }> = [];

      for (const network of networks) {
        // Use the database function to get settlements
        const { data, error } = await supabase.rpc('get_network_settlements', {
          _network_id: network.id
        });

        if (error) {
          console.error('Error fetching settlements for network:', network.id, error);
          continue;
        }

        if (data && data.length > 0) {
          results.push({
            networkId: network.id,
            networkName: network.name,
            debts: data.map((d: any) => ({
              from: d.from_user_name,
              to: d.to_user_name,
              amount: Number(d.amount)
            }))
          });
        }
      }

      return results;
    },
    enabled: !!networks && networks.length > 0,
  });

  if (networksLoading || debtsLoading) return <div className="text-muted-foreground py-4">Loading network debts...</div>;

  if (!allDebts || allDebts.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-3 text-blue-600 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Loan According to Members (Network-wise)
        </h2>
        <div className="text-muted-foreground py-4">No pending debts across networks.</div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-3 text-blue-600 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Loan According to Members (Network-wise)
      </h2>
      <div className="space-y-4">
        {allDebts.map(network => (
          <Card key={network.networkId} className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-700">{network.networkName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {network.debts.map((debt, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-red-600">{debt.from}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-green-600">{debt.to}</span>
                    </div>
                    <span className="font-bold">{formatAmount(debt.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

const LoanTransactionsSection: React.FC = () => {
  const { transactions, isLoading: txLoading } = useTransactions();
  const { categories, isLoading: catLoading } = useCategories();
  const { formatAmount } = useCurrency();

  if (txLoading || catLoading) return <div className="text-muted-foreground py-4">Loading transactions...</div>;

  // Find category ids whose name includes 'loan' (case-insensitive)
  const loanCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes('loan')
  );
  const loanCategoryIds = loanCategories.map(cat => cat.id);

  // Filter transactions with those category ids
  const loanTxs = transactions.filter(tx =>
    tx.category_id && loanCategoryIds.includes(tx.category_id)
  );

  if (!loanTxs.length) {
    return (
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-2 text-green-700">Loan Transactions</h2>
        <div className="text-muted-foreground py-4">No transactions found for loan categories.</div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-2 text-green-700">Loan Transactions</h2>
      <div className="bg-background border rounded-lg overflow-x-auto">
        <Table>
          <TableCaption>All your transactions in "Loan" categories.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loanTxs.map(tx => {
              const cat = categories.find(c => c.id === tx.category_id);
              return (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      className="inline-block w-4 h-4 rounded-full align-middle mr-2"
                      style={{ backgroundColor: cat?.color }}
                      aria-label={`Category color for ${cat?.name}`}
                    />
                    <span className="text-xs">{cat?.name}</span>
                  </TableCell>
                  <TableCell>{tx.reason}</TableCell>
                  <TableCell>
                    <span
                      className={
                        tx.type === 'income'
                          ? 'text-green-700 font-medium'
                          : 'text-red-700 font-medium'
                      }
                    >
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span>
                      {tx.type === 'income' && tx.income
                        ? formatAmount(tx.income)
                        : tx.type === 'expense' && tx.expense
                        ? formatAmount(tx.expense)
                        : '-'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default Credits;
