
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeftRight, Edit, Trash2 } from 'lucide-react';
import { useTransfers } from '@/hooks/useTransfers';
import { useWallets } from '@/hooks/useWallets';
import { useCurrency } from '@/hooks/useCurrency';

export const FinanceTransfers: React.FC = () => {
  const { currency, formatAmount } = useCurrency();
  const { transfers, isLoading, createTransfer, updateTransfer, deleteTransfer } = useTransfers();
  const { wallets } = useWallets();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<any>(null);
  const [formData, setFormData] = useState({
    from_wallet_id: '',
    to_wallet_id: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTransfer) {
      updateTransfer.mutate({ id: editingTransfer.id, ...formData });
    } else {
      createTransfer.mutate(formData);
    }
    
    setIsDialogOpen(false);
    setEditingTransfer(null);
    setFormData({ from_wallet_id: '', to_wallet_id: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
  };

  const handleEdit = (transfer: any) => {
    setEditingTransfer(transfer);
    setFormData({
      from_wallet_id: transfer.from_wallet_id,
      to_wallet_id: transfer.to_wallet_id,
      amount: transfer.amount,
      date: transfer.date,
      description: transfer.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transfer?')) {
      deleteTransfer.mutate(id);
    }
  };

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700">Transfers</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Transfer money between wallets</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTransfer ? 'Edit Transfer' : 'Create New Transfer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="from_wallet">From Wallet</Label>
                <Select value={formData.from_wallet_id} onValueChange={(value) => setFormData({ ...formData, from_wallet_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="to_wallet">To Wallet</Label>
                <Select value={formData.to_wallet_id} onValueChange={(value) => setFormData({ ...formData, to_wallet_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Transfer description"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700 flex-1">
                  {editingTransfer ? 'Update' : 'Create'} Transfer
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading transfers...</div>
      ) : transfers.length === 0 ? (
        <Card className="border-green-200">
          <CardContent className="text-center py-12">
            <ArrowLeftRight className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transfers Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first transfer between wallets</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer) => (
            <Card key={transfer.id} className="border-green-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <ArrowLeftRight className="h-8 w-8 text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-green-700 truncate">
                        {getWalletName(transfer.from_wallet_id)} → {getWalletName(transfer.to_wallet_id)}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{transfer.description}</p>
                      <p className="text-sm text-muted-foreground">{new Date(transfer.date).toLocaleDateString()}</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-red-600 font-medium">
                          {getWalletName(transfer.from_wallet_id)}: -{formatAmount(transfer.amount)}
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          {getWalletName(transfer.to_wallet_id)}: +{formatAmount(transfer.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-left sm:text-right">
                      <p className="text-xl font-bold text-green-700">{formatAmount(transfer.amount)}</p>
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        {transfer.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(transfer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(transfer.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FinanceTransfers;
