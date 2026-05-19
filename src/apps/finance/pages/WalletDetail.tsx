
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Calendar, TrendingUp, TrendingDown, Wallet, ArrowLeft, ArrowLeftRight, Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransfers } from '@/hooks/useTransfers';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategories } from '@/hooks/useCategories';
import { TransactionForm } from '@/apps/finance/components/TransactionForm';
import { MultiTransactionForm, MultiTransactionEntry } from '@/apps/finance/components/MultiTransactionForm';
import { CompactDateRangeFilter } from '@/apps/finance/components/CompactDateRangeFilter';
import { CalendarModeToggle } from '@/apps/finance/components/CalendarModeToggle';
import { useCalendarMode, formatDateByMode } from '@/apps/finance/hooks/useCalendarMode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const WalletDetail: React.FC = () => {
  const { id: walletId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currency, formatAmount } = useCurrency();
  const { getWalletById, wallets, isLoading: walletsLoading } = useWallets();
  const { transactions, createTransactionsBatch, updateTransaction, deleteTransaction } = useTransactions();
  const { transfers } = useTransfers();
  const { categories } = useCategories();
  const { toast } = useToast();

  // Transaction form state
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isMultiTransactionDialogOpen, setIsMultiTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transactionFormData, setTransactionFormData] = useState({
    reason: '',
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    wallet_id: walletId || '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    nepali_date: ''
  });

  console.log('WalletDetail - walletId from params:', walletId);


  useEffect(() => {
    if (!walletId) return;

    setTransactionFormData((prev) => ({
      ...prev,
      wallet_id: prev.wallet_id || walletId
    }));
  }, [walletId]);

  // Alert when uncategorized transactions exist on this wallet
  const [alertedWalletId, setAlertedWalletId] = useState<string | null>(null);
  useEffect(() => {
    if (!walletId || alertedWalletId === walletId) return;
    const uncats = transactions.filter(t => t.wallet_id === walletId && !t.category_id);
    if (uncats.length > 0) {
      toast({
        title: 'Uncategorized transactions found',
        description: `${uncats.length} transaction${uncats.length === 1 ? '' : 's'} in this wallet ${uncats.length === 1 ? 'has' : 'have'} no category. They are shown at the top.`,
        variant: 'destructive',
      });
      setAlertedWalletId(walletId);
    }
  }, [walletId, transactions, alertedWalletId, toast]);

  // Resolve wallet from the wallets query to avoid refresh race conditions
  const wallet = walletId ? getWalletById(walletId) : undefined;
  const walletLoading = walletsLoading;

  // Date range filter state
  const [filterStart, setFilterStart] = useState<Date | null>(null);
  const { mode: calendarMode } = useCalendarMode();
  const [filterEnd, setFilterEnd] = useState<Date | null>(null);

  const inDateRange = (dateStr: string) => {
    const d = new Date(dateStr);
    if (filterStart && d < new Date(filterStart.toDateString())) return false;
    if (filterEnd) {
      const end = new Date(filterEnd);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  };

  const walletTransactions = transactions.filter(t => t.wallet_id === walletId);

  // Include transfers as transactions
  const walletTransfers = transfers.filter(t =>
    t.from_wallet_id === walletId || t.to_wallet_id === walletId
  );

  // Count uncategorized expense/income transactions (transfers don't have categories)
  const uncategorizedCount = walletTransactions.filter(t => !t.category_id).length;

  // Combine, filter by date, then sort: uncategorized first, then newest first
  const allTransactions = [
    ...walletTransactions.map(t => ({
      ...t,
      transaction_type: 'transaction' as const,
      display_amount: t.income || t.expense || 0,
      is_income: t.type === 'income'
    })),
    ...walletTransfers.map(t => ({
      id: t.id,
      reason: t.description || 'Transfer',
      date: t.date,
      created_at: t.created_at,
      transaction_type: 'transfer' as const,
      display_amount: t.amount,
      is_income: t.to_wallet_id === walletId,
      transfer_details: t
    }))
  ]
    .filter(t => inDateRange(t.date))
    .sort((a, b) => {
      const aUncat = a.transaction_type === 'transaction' && !(a as any).category_id ? 1 : 0;
      const bUncat = b.transaction_type === 'transaction' && !(b as any).category_id ? 1 : 0;
      if (aUncat !== bUncat) return bUncat - aUncat;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Calculate running balances and previous balances for wallet detail page
  const { runningBalances, previousBalances } = React.useMemo(() => {
    if (!wallet) return { runningBalances: new Map<string, number>(), previousBalances: new Map<string, number>() };
    
    const runningMap = new Map<string, number>();
    const previousMap = new Map<string, number>();
    let currentBalance = wallet.balance;
    
    // Go through transactions newest to oldest
    allTransactions.forEach(item => {
      runningMap.set(item.id, currentBalance);
      
      // Calculate previous balance (before this transaction)
      let prevBalance: number;
      if (item.is_income) {
        prevBalance = currentBalance - item.display_amount;
      } else {
        prevBalance = currentBalance + item.display_amount;
      }
      previousMap.set(item.id, prevBalance);
      
      // Move to previous state for next iteration
      currentBalance = prevBalance;
    });
    
    return { runningBalances: runningMap, previousBalances: previousMap };
  }, [allTransactions, wallet]);

  if (walletLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Loading Wallet...</h3>
            <p className="text-muted-foreground">Please wait while we fetch your wallet details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!walletLoading && !wallet) {
    console.error('Wallet not found after wallets loaded');
    console.log('Available wallets:', wallets.map(w => ({ id: w.id, name: w.name })));
    
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border-red-200">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Wallet Not Found</h3>
            <p className="text-muted-foreground">
              The wallet you're looking for doesn't exist or you don't have access to it.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Wallet ID: {walletId}
            </p>
            <Button onClick={() => navigate('/finance/wallets')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wallets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalIncome = walletTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.income || 0), 0);

  const totalExpense = walletTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.expense || 0), 0);

  const getOtherWallet = (transfer: any) => {
    const otherWalletId = transfer.from_wallet_id === walletId ? transfer.to_wallet_id : transfer.from_wallet_id;
    const otherWallet = wallets.find(w => w.id === otherWalletId);
    return otherWallet?.name || 'Unknown Wallet';
  };

  const getCategoryById = (categoryId?: string | null) => {
    if (!categoryId) return null;
    return categories.find((category) => category.id === categoryId) || null;
  };

  const handleAddTransaction = () => {
    setIsMultiTransactionDialogOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setTransactionFormData({
      reason: transaction.reason,
      type: transaction.type,
      amount: transaction.income || transaction.expense || 0,
      wallet_id: transaction.wallet_id,
      category_id: transaction.category_id || '',
      date: transaction.date,
      nepali_date: transaction.nepali_date || ''
    });
    setIsTransactionDialogOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction.mutate(id, {
        onSuccess: () => {
          toast({ title: 'Transaction deleted successfully' });
        },
        onError: (error: Error) => {
          toast({ title: 'Failed to delete transaction', description: error.message, variant: 'destructive' });
        }
      });
    }
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTransaction) return;

    // Validation
    if (!transactionFormData.reason.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter a description', variant: 'destructive' });
      return;
    }
    if (!transactionFormData.wallet_id) {
      toast({ title: 'Validation Error', description: 'Please select a wallet', variant: 'destructive' });
      return;
    }
    if (transactionFormData.amount <= 0) {
      toast({ title: 'Validation Error', description: 'Amount must be greater than 0', variant: 'destructive' });
      return;
    }

    const transactionData = {
      reason: transactionFormData.reason,
      type: transactionFormData.type,
      wallet_id: transactionFormData.wallet_id,
      category_id: transactionFormData.category_id || undefined,
      date: transactionFormData.date,
      nepali_date: transactionFormData.nepali_date || undefined,
      income: transactionFormData.type === 'income' ? transactionFormData.amount : undefined,
      expense: transactionFormData.type === 'expense' ? transactionFormData.amount : undefined
    };

    updateTransaction.mutate({ id: editingTransaction.id, ...transactionData }, {
      onSuccess: () => {
        toast({ title: 'Transaction updated successfully' });
        setIsTransactionDialogOpen(false);
        setEditingTransaction(null);
        resetFormData();
      },
      onError: (error: Error) => {
        toast({ title: 'Failed to update transaction', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleMultiTransactionSubmit = async (entries: MultiTransactionEntry[]) => {
    const batchPayload = entries.map((entry) => {
      return {
        reason: entry.reason,
        type: entry.type,
        wallet_id: entry.wallet_id || walletId || '',
        category_id: entry.category_id || undefined,
        date: entry.date,
        nepali_date: entry.nepali_date || undefined,
        income: entry.type === 'income' ? entry.amount : undefined,
        expense: entry.type === 'expense' ? entry.amount : undefined
      };
    });

    await createTransactionsBatch.mutateAsync(batchPayload);
  };

  const resetFormData = () => {
    setTransactionFormData({
      reason: '',
      type: 'expense',
      amount: 0,
      wallet_id: walletId || '',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
      nepali_date: ''
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <MultiTransactionForm
        isOpen={isMultiTransactionDialogOpen}
        setIsOpen={setIsMultiTransactionDialogOpen}
        walletName={wallet.name}
        walletId={walletId || ''}
        wallets={wallets}
        categories={categories}
        onSubmit={handleMultiTransactionSubmit}
      />

      {/* Transaction Form Dialog */}
      <TransactionForm
        isOpen={isTransactionDialogOpen}
        setIsOpen={setIsTransactionDialogOpen}
        editingTransaction={editingTransaction}
        setEditingTransaction={setEditingTransaction}
        formData={transactionFormData}
        setFormData={setTransactionFormData}
        onSubmit={handleTransactionSubmit}
        wallets={wallets}
        categories={categories}
        defaultWalletId={walletId || ''}
        hideTrigger
      />

      {/* Wallet Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700 flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            {wallet.name}
          </h1>
          <p className="text-muted-foreground">Wallet details and transaction history</p>
        </div>
        <Button onClick={handleAddTransaction} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {uncategorizedCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Uncategorized transactions</AlertTitle>
          <AlertDescription>
            {uncategorizedCount} transaction{uncategorizedCount === 1 ? '' : 's'} in this wallet {uncategorizedCount === 1 ? 'is' : 'are'} missing a category. They are pinned to the top — click edit to assign one.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 flex-wrap">
        <CompactDateRangeFilter
          startDate={filterStart}
          endDate={filterEnd}
          onChange={(s, e) => { setFilterStart(s); setFilterEnd(e); }}
        />
        <CalendarModeToggle />
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatAmount(wallet.balance)}
            </div>
            <Badge variant="outline" className="border-green-200 text-green-700 mt-1">
              {wallet.currency}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatAmount(totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatAmount(totalExpense)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {allTransactions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}  
<Card className="border-green-200">
  <CardHeader>
    <CardTitle className="text-green-700">Transactions & Transfers</CardTitle>
  </CardHeader>
  <CardContent>
    {allTransactions.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found for this wallet
      </div>
    ) : (
      <div className="space-y-4">
        {allTransactions.map((transaction) => {
          const isUncat = transaction.transaction_type === 'transaction' && !(transaction as any).category_id;
          return (
          <div
            key={transaction.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg ${isUncat ? 'border-red-300 bg-red-50/40 dark:bg-red-950/20' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full ${
                  transaction.transaction_type === 'transfer'
                    ? 'bg-blue-100'
                    : transaction.is_income
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}
              >
                {transaction.transaction_type === 'transfer' ? (
                  <ArrowLeftRight className="h-4 w-4 text-blue-600" />
                ) : transaction.is_income ? (
                  <ArrowUp className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {transaction.transaction_type === 'transfer'
                    ? transaction.is_income
                      ? `Transfer from ${getOtherWallet(transaction.transfer_details)}`
                      : `Transfer to ${getOtherWallet(transaction.transfer_details)}`
                    : transaction.reason}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDateByMode(transaction.date, (transaction as any).nepali_date, calendarMode)}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{wallet.name}</p>
                  {transaction.transaction_type === 'transaction' && (
                    (() => {
                      const category = getCategoryById((transaction as any).category_id);
                      return (
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-muted/60 border border-transparent"
                          style={category ? { color: category.color, borderColor: `${category.color}33`, backgroundColor: `${category.color}14` } : undefined}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {category?.name || 'Uncategorized'}
                        </Badge>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p
                  className={`font-bold ${
                    transaction.is_income ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.is_income ? '+' : '-'}
                  {formatAmount(transaction.display_amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {wallet.name}: {formatAmount(previousBalances.get(transaction.id) || 0)} → {formatAmount(runningBalances.get(transaction.id) || 0)}
                </p>
                {transaction.transaction_type === 'transfer' && transaction.transfer_details && (() => {
                  const otherWalletId = transaction.is_income 
                    ? transaction.transfer_details.from_wallet_id 
                    : transaction.transfer_details.to_wallet_id;
                  const otherWallet = wallets.find(w => w.id === otherWalletId);
                  if (!otherWallet) return null;
                  const otherCurrentBal = runningBalances.get(transaction.id) || 0;
                  const thisPrev = previousBalances.get(transaction.id) || 0;
                  // The other wallet changes inversely
                  const otherChange = transaction.is_income ? -transaction.display_amount : transaction.display_amount;
                  // We can approximate: other wallet's balance change is inverse
                  return (
                    <p className="text-xs text-muted-foreground">
                      {otherWallet.name}: {transaction.is_income ? `-${formatAmount(transaction.display_amount)}` : `+${formatAmount(transaction.display_amount)}`}
                    </p>
                  );
                })()}
                <Badge
                  variant="outline"
                  className={`mt-1 ${
                    transaction.transaction_type === 'transfer'
                      ? 'border-blue-200 text-blue-700'
                      : transaction.is_income
                      ? 'border-green-200 text-green-700'
                      : 'border-red-200 text-red-700'
                  }`}
                >
                  {transaction.transaction_type === 'transfer'
                    ? 'transfer'
                    : transaction.is_income
                    ? 'income'
                    : 'expense'}
                </Badge>
              </div>
              {transaction.transaction_type === 'transaction' && (
                <div className="flex flex-col space-y-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleEditTransaction(transaction)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDeleteTransaction(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
        })}
      </div>
    )}
  </CardContent>
</Card>

    </div>
  );
};

export default WalletDetail;
