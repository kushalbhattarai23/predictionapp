import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransfers } from '@/hooks/useTransfers';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { NepaliDatePicker } from '@/components/ui/nepali-date-picker';
import { convertEnglishToNepali, formatNepaliDate } from '@/utils/dateConverter';
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Trash2, 
  Check, 
  Plus,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft
} from 'lucide-react';

interface ExtractedTransaction {
  id: string;
  reason: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  nepali_date: string;
  category_hint: string;
  is_transfer: boolean;
  selected: boolean;
  wallet_id: string;
  category_id: string;
}

interface ExtractedTransfer {
  id: string;
  description: string;
  amount: number;
  date: string;
  from_account: string;
  to_account: string;
  selected: boolean;
  from_wallet_id: string;
  to_wallet_id: string;
}

export const MultipleTransactions: React.FC = () => {
  const { toast } = useToast();
  const { createTransaction } = useTransactions();
  const { createTransfer } = useTransfers();
  const { wallets } = useWallets();
  const { categories } = useCategories();
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transactions, setTransactions] = useState<ExtractedTransaction[]>([]);
  const [transfers, setTransfers] = useState<ExtractedTransfer[]>([]);
  const [summary, setSummary] = useState<{ total_income: number; total_expense: number; net: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractTransactions = async () => {
    if (!imagePreview) {
      toast({ title: 'Please upload an image first', variant: 'destructive' });
      return;
    }

    setIsExtracting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('extract-transactions-ocr', {
        body: { imageBase64: imagePreview },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to extract transactions');
      }

      const data = response.data;
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Map extracted transactions with unique IDs and default values
      const defaultWalletId = wallets.length > 0 ? wallets[0].id : '';
      
      const mappedTransactions: ExtractedTransaction[] = (data.transactions || []).map((t: any, index: number) => {
        const transactionDate = t.date || new Date().toISOString().split('T')[0];
        const dateObj = new Date(transactionDate);
        const nepaliDateObj = convertEnglishToNepali(dateObj);
        const nepaliDateStr = formatNepaliDate(nepaliDateObj.year, nepaliDateObj.month, nepaliDateObj.day);
        
        return {
          id: `txn-${index}-${Date.now()}`,
          reason: t.reason || 'Unknown',
          type: t.type || 'expense',
          amount: t.amount || 0,
          date: transactionDate,
          nepali_date: nepaliDateStr,
          category_hint: t.category_hint || 'Other',
          is_transfer: t.is_transfer || false,
          selected: true,
          wallet_id: defaultWalletId,
          category_id: findMatchingCategory(t.category_hint),
        };
      });

      const mappedTransfers: ExtractedTransfer[] = (data.transfers || []).map((t: any, index: number) => ({
        id: `transfer-${index}-${Date.now()}`,
        description: t.description || 'Transfer',
        amount: t.amount || 0,
        date: t.date || new Date().toISOString().split('T')[0],
        from_account: t.from_account || '',
        to_account: t.to_account || '',
        selected: true,
        from_wallet_id: defaultWalletId,
        to_wallet_id: wallets.length > 1 ? wallets[1].id : defaultWalletId,
      }));

      setTransactions(mappedTransactions);
      setTransfers(mappedTransfers);
      setSummary(data.summary || null);

      toast({ 
        title: 'Transactions extracted successfully', 
        description: `Found ${mappedTransactions.length} transactions and ${mappedTransfers.length} transfers` 
      });
    } catch (error: any) {
      console.error('Error extracting transactions:', error);
      toast({ 
        title: 'Failed to extract transactions', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const findMatchingCategory = (hint: string): string => {
    if (!hint || categories.length === 0) return '';
    const lowerHint = hint.toLowerCase();
    const match = categories.find(c => c.name.toLowerCase().includes(lowerHint) || lowerHint.includes(c.name.toLowerCase()));
    return match?.id || '';
  };

  const handleToggleTransaction = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, selected: !t.selected } : t
    ));
  };

  const handleToggleTransfer = (id: string) => {
    setTransfers(prev => prev.map(t => 
      t.id === id ? { ...t, selected: !t.selected } : t
    ));
  };

  const handleUpdateTransaction = (id: string, field: string, value: any) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleDateChange = (id: string, englishDate: string, nepaliDate: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, date: englishDate, nepali_date: nepaliDate } : t
    ));
  };

  const handleUpdateTransfer = (id: string, field: string, value: any) => {
    setTransfers(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleDeleteTransfer = (id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
  };

  const handleSelectAll = () => {
    const allSelected = transactions.every(t => t.selected) && transfers.every(t => t.selected);
    setTransactions(prev => prev.map(t => ({ ...t, selected: !allSelected })));
    setTransfers(prev => prev.map(t => ({ ...t, selected: !allSelected })));
  };

  const handleSaveSelected = async () => {
    const selectedTransactions = transactions.filter(t => t.selected);
    const selectedTransfers = transfers.filter(t => t.selected);

    if (selectedTransactions.length === 0 && selectedTransfers.length === 0) {
      toast({ title: 'No items selected', variant: 'destructive' });
      return;
    }

    // Validate wallet selections
    for (const t of selectedTransactions) {
      if (!t.wallet_id) {
        toast({ title: 'Please select a wallet for all transactions', variant: 'destructive' });
        return;
      }
    }

    for (const t of selectedTransfers) {
      if (!t.from_wallet_id || !t.to_wallet_id) {
        toast({ title: 'Please select wallets for all transfers', variant: 'destructive' });
        return;
      }
    }

    setIsSaving(true);
    try {
      // Save transactions
      for (const t of selectedTransactions) {
        await createTransaction.mutateAsync({
          reason: t.reason,
          type: t.type,
          income: t.type === 'income' ? t.amount : undefined,
          expense: t.type === 'expense' ? t.amount : undefined,
          wallet_id: t.wallet_id,
          category_id: t.category_id || undefined,
          date: t.date,
          nepali_date: t.nepali_date,
        });
      }

      // Save transfers
      for (const t of selectedTransfers) {
        await createTransfer.mutateAsync({
          from_wallet_id: t.from_wallet_id,
          to_wallet_id: t.to_wallet_id,
          amount: t.amount,
          date: t.date,
          description: t.description,
        });
      }

      toast({ 
        title: 'Saved successfully', 
        description: `${selectedTransactions.length} transactions and ${selectedTransfers.length} transfers saved` 
      });

      // Clear the form
      setTransactions([]);
      setTransfers([]);
      setSummary(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({ 
        title: 'Failed to save', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = transactions.filter(t => t.selected).length + transfers.filter(t => t.selected).length;
  const totalCount = transactions.length + transfers.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-green-700">Multiple Transactions</h1>
        <p className="text-muted-foreground">Upload a screenshot to extract and add multiple transactions at once</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Transaction Screenshot
          </CardTitle>
          <CardDescription>
            Upload a screenshot of your bank statement, transaction history, or any list of transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>
            <Button 
              onClick={handleExtractTransactions} 
              disabled={!imagePreview || isExtracting}
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
                  Extract Transactions
                </>
              )}
            </Button>
          </div>

          {imagePreview && (
            <div className="mt-4">
              <Label className="text-sm text-muted-foreground mb-2 block">Preview:</Label>
              <img 
                src={imagePreview} 
                alt="Transaction screenshot" 
                className="max-h-64 rounded-lg border object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-xl font-bold text-green-600">{summary.total_income?.toLocaleString() || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Expense</p>
                <p className="text-xl font-bold text-red-600">{summary.total_expense?.toLocaleString() || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 flex items-center gap-3">
              <ArrowUpDown className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Net</p>
                <p className={`text-xl font-bold ${(summary.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.net?.toLocaleString() || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions List */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5" />
                Extracted Transactions ({transactions.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className={`p-4 rounded-lg border ${transaction.selected ? 'bg-accent/50 border-primary/30' : 'bg-muted/30'}`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={transaction.selected}
                    onCheckedChange={() => handleToggleTransaction(transaction.id)}
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {transaction.type === 'income' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {transaction.type}
                      </Badge>
                      <Badge variant="outline">{transaction.category_hint}</Badge>
                      <span className="text-sm text-muted-foreground">{transaction.date}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={transaction.reason}
                          onChange={(e) => handleUpdateTransaction(transaction.id, 'reason', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={transaction.type}
                          onValueChange={(value: 'income' | 'expense') => handleUpdateTransaction(transaction.id, 'type', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={transaction.amount}
                          onChange={(e) => handleUpdateTransaction(transaction.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Wallet</Label>
                        <Select
                          value={transaction.wallet_id}
                          onValueChange={(value) => handleUpdateTransaction(transaction.id, 'wallet_id', value)}
                        >
                          <SelectTrigger className="h-9">
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
                        <Label className="text-xs">Category</Label>
                        <Select
                          value={transaction.category_id}
                          onValueChange={(value) => handleUpdateTransaction(transaction.id, 'category_id', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <NepaliDatePicker
                        label="Transaction Date"
                        value={transaction.date}
                        onChange={(englishDate, nepaliDate) => handleDateChange(transaction.id, englishDate, nepaliDate)}
                        id={`date-${transaction.id}`}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Transfers List */}
      {transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Extracted Transfers ({transfers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transfers.map((transfer) => (
              <div 
                key={transfer.id} 
                className={`p-4 rounded-lg border ${transfer.selected ? 'bg-accent/50 border-primary/30' : 'bg-muted/30'}`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={transfer.selected}
                    onCheckedChange={() => handleToggleTransfer(transfer.id)}
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <ArrowRightLeft className="w-3 h-3 mr-1" />
                        Transfer
                      </Badge>
                      <span className="text-sm text-muted-foreground">{transfer.date}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={transfer.description}
                          onChange={(e) => handleUpdateTransfer(transfer.id, 'description', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Amount</Label>
                        <Input
                          type="number"
                          value={transfer.amount}
                          onChange={(e) => handleUpdateTransfer(transfer.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">From Wallet</Label>
                        <Select
                          value={transfer.from_wallet_id}
                          onValueChange={(value) => handleUpdateTransfer(transfer.id, 'from_wallet_id', value)}
                        >
                          <SelectTrigger className="h-9">
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
                        <Label className="text-xs">To Wallet</Label>
                        <Select
                          value={transfer.to_wallet_id}
                          onValueChange={(value) => handleUpdateTransfer(transfer.id, 'to_wallet_id', value)}
                        >
                          <SelectTrigger className="h-9">
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
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTransfer(transfer.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {(transactions.length > 0 || transfers.length > 0) && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSelected} 
            disabled={isSaving || selectedCount === 0}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Selected ({selectedCount})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MultipleTransactions;
