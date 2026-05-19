import React, { useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NepaliDatePicker } from '@/components/ui/nepali-date-picker';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';

export interface MultiTransactionEntry {
  reason: string;
  type: 'income' | 'expense';
  amount: number;
  wallet_id: string;
  category_id: string;
  date: string;
  nepali_date: string;
}

interface MultiTransactionFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  walletName: string;
  walletId: string;
  wallets: any[];
  categories: any[];
  onSubmit: (entries: MultiTransactionEntry[]) => Promise<void>;
}

const buildEntry = (walletId: string): MultiTransactionEntry => ({
  reason: '',
  type: 'expense',
  amount: 0,
  wallet_id: walletId,
  category_id: '',
  date: new Date().toISOString().split('T')[0],
  nepali_date: ''
});

export const MultiTransactionForm: React.FC<MultiTransactionFormProps> = ({
  isOpen,
  setIsOpen,
  walletName,
  walletId,
  wallets,
  categories,
  onSubmit
}) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<MultiTransactionEntry[]>([buildEntry(walletId)]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = useMemo(
    () => entries.every((entry) => entry.reason.trim() && entry.amount > 0 && entry.date && entry.wallet_id),
    [entries]
  );

  const handleClose = () => {
    if (isSaving || isExtracting) return;
    setIsOpen(false);
    setEntries([buildEntry(walletId)]);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRowChange = (index: number, patch: Partial<MultiTransactionEntry>) => {
    setEntries((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleAddRow = () => {
    setEntries((prev) => [...prev, buildEntry(walletId)]);
  };

  const handleRemoveRow = (index: number) => {
    setEntries((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const findMatchingCategory = (hint?: string): string => {
    if (!hint) return '';

    const lowerHint = hint.toLowerCase().trim();
    const found = categories.find((category) => category.name?.toLowerCase?.() === lowerHint);
    if (found) return found.id;

    const fuzzyFound = categories.find((category) => category.name?.toLowerCase?.().includes(lowerHint));
    return fuzzyFound?.id || '';
  };

  const handleExtractTransactions = async () => {
    if (!imagePreview) {
      toast({ title: 'Please upload an image first', variant: 'destructive' });
      return;
    }

    setIsExtracting(true);
    try {
      const response = await supabase.functions.invoke('extract-transactions-ocr', {
        body: { imageBase64: imagePreview }
      });

      if (response.error) throw new Error(response.error.message || 'Failed to extract transactions');

      const extracted = response.data?.transactions || [];
      if (!extracted.length) {
        toast({ title: 'No transactions found in image', variant: 'destructive' });
        return;
      }

      const mapped: MultiTransactionEntry[] = extracted.map((item: any) => ({
        reason: item.reason || 'Unknown',
        type: item.type === 'income' ? 'income' : 'expense',
        amount: Number(item.amount) || 0,
        wallet_id: walletId,
        category_id: findMatchingCategory(item.category_hint),
        date: item.date || new Date().toISOString().split('T')[0],
        nepali_date: ''
      }));

      setEntries(mapped);
      toast({ title: `${mapped.length} transactions extracted` });
    } catch (error: any) {
      toast({
        title: 'Failed to extract transactions',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId || !canSubmit) return;

    try {
      setIsSaving(true);
      await onSubmit(entries);
      setEntries([buildEntry(walletId)]);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[95vw] max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Multiple Transactions</DialogTitle>
          <p className="text-sm text-muted-foreground">Current wallet: {walletName}</p>
        </DialogHeader>

        <div className="space-y-3 border rounded-lg p-3">
          <Label>Upload Transaction Screenshot</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="cursor-pointer"
              disabled={isSaving || isExtracting}
            />
            <Button
              type="button"
              onClick={handleExtractTransactions}
              disabled={!imagePreview || isExtracting || isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Extract from Image
                </>
              )}
            </Button>
          </div>
          {imagePreview && (
            <img src={imagePreview} alt="Uploaded transaction" className="max-h-48 rounded border object-contain" />
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {entries.map((entry, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Create New Transaction #{index + 1}</h4>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemoveRow(index)}
                  disabled={entries.length === 1 || isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={entry.reason}
                  onChange={(e) => handleRowChange(index, { reason: e.target.value })}
                  placeholder="e.g., Groceries, Salary"
                  required
                />
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  value={entry.type}
                  onValueChange={(value: 'income' | 'expense') => handleRowChange(index, { type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entry.amount}
                  onChange={(e) => handleRowChange(index, { amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label>Wallet</Label>
                <Select
                  value={entry.wallet_id}
                  onValueChange={(value) => handleRowChange(index, { wallet_id: value })}
                >
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
                <Label>Category (Optional)</Label>
                <Select
                  value={entry.category_id || 'none'}
                  onValueChange={(value) => handleRowChange(index, { category_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <NepaliDatePicker
                  label="Transaction Date"
                  value={entry.date}
                  onChange={(englishDate, nepaliDate) =>
                    handleRowChange(index, { date: englishDate, nepali_date: nepaliDate })
                  }
                  required
                  id={`multi-transaction-date-${index}`}
                />
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleAddRow} disabled={isSaving || isExtracting}>
              <Upload className="w-4 h-4 mr-2" />
              Add Another Transaction
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={!canSubmit || isSaving}>
              {isSaving ? 'Saving...' : `Create ${entries.length} Transaction${entries.length > 1 ? 's' : ''}`}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving || isExtracting}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
