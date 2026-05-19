
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Wallet, Edit, Trash2, Eye } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/hooks/useCurrency';

export const FinanceWallets: React.FC = () => {
  const navigate = useNavigate();
  const { currency, formatAmount } = useCurrency();
  const { wallets, isLoading, createWallet, updateWallet, deleteWallet } = useWallets();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    balance: 0,
    currency: 'NPR',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingWallet) {
      updateWallet.mutate({ id: editingWallet.id, ...formData });
    } else {
      createWallet.mutate(formData);
    }
    
    setIsDialogOpen(false);
    setEditingWallet(null);
    setFormData({ name: '', balance: 0, currency: 'NPR' });
  };

  const handleEdit = (wallet: any) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      balance: wallet.balance,
      currency: wallet.currency,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this wallet?')) {
      deleteWallet.mutate(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700">Wallets</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your accounts and balances</p>
          {wallets.length > 0 && (
            <div className="mt-2 text-lg font-semibold text-green-600">
              Total Balance: {formatAmount(wallets.reduce((sum, w) => sum + w.balance, 0))}
            </div>
          )}
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingWallet ? 'Edit Wallet' : 'Create New Wallet'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Wallet Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cash, Bank Account"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="balance">Initial Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NPR">NPR (रु)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700 flex-1">
                  {editingWallet ? 'Update' : 'Create'} Wallet
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
        <div className="text-center py-8">Loading wallets...</div>
      ) : wallets.length === 0 ? (
        <Card className="border-green-200">
          <CardContent className="text-center py-12">
            <Wallet className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Wallets Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first wallet to start tracking your finances</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <Wallet className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <CardTitle className="text-green-700 truncate">{wallet.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-green-700">
                  {formatAmount(wallet.balance)}
                </div>
                <Badge variant="outline" className="border-green-200 text-green-700">
                  {wallet.currency}
                </Badge>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/finance/wallet/${wallet.id}`)} className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(wallet)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(wallet.id)} className="flex-1">
                    <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FinanceWallets;
