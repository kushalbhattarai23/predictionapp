
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { NepaliDatePicker } from '@/components/ui/nepali-date-picker';

interface TransferFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editingTransfer: any;
  setEditingTransfer: (transfer: any) => void;
  formData: {
    from_wallet_id: string;
    to_wallet_id: string;
    amount: number;
    date: string;
    description: string;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  wallets: any[];
}

export const TransferForm: React.FC<TransferFormProps> = ({
  isOpen,
  setIsOpen,
  editingTransfer,
  setEditingTransfer,
  formData,
  setFormData,
  onSubmit,
  wallets
}) => {
  const { formatAmount } = useCurrency();

  const handleClose = () => {
    setIsOpen(false);
    setEditingTransfer(null);
    setFormData({ 
      from_wallet_id: '', 
      to_wallet_id: '', 
      amount: 0, 
      date: new Date().toISOString().split('T')[0], 
      description: '' 
    });
  };

  const handleDateChange = (englishDate: string, nepaliDate: string) => {
    setFormData({ ...formData, date: englishDate });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          Add Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTransfer ? 'Edit Transfer' : 'Create New Transfer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="from_wallet">From Wallet</Label>
            <Select value={formData.from_wallet_id} onValueChange={(value) => setFormData({ ...formData, from_wallet_id: value })} required>
              <SelectTrigger>
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name} ({formatAmount(wallet.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="to_wallet">To Wallet</Label>
            <Select value={formData.to_wallet_id} onValueChange={(value) => setFormData({ ...formData, to_wallet_id: value })} required>
              <SelectTrigger>
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name} ({formatAmount(wallet.balance)})
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
          
          <NepaliDatePicker
            label="Date"
            value={formData.date}
            onChange={handleDateChange}
            required
            id="transfer-date"
          />
          
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
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
