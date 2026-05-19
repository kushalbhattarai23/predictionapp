import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransfers } from '@/hooks/useTransfers';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';
import { TransactionForm } from '@/apps/finance/components/TransactionForm';
import { TransferForm } from '@/apps/finance/components/TransferForm';
import { TransactionsList } from '@/apps/finance/components/TransactionsList';
import { CompactDateRangeFilter } from '@/apps/finance/components/CompactDateRangeFilter';
import { CalendarModeToggle } from '@/apps/finance/components/CalendarModeToggle';

interface UnifiedTransaction {
  id: string;
  type: 'transaction' | 'transfer';
  subtype?: 'income' | 'expense';
  reason?: string;
  description?: string;
  amount: number;
  wallet_id?: string;
  from_wallet_id?: string;
  to_wallet_id?: string;
  category_id?: string;
  date: string;
  nepali_date?: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 5;

export const FinanceTransactions: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { transactions, isLoading: transactionsLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { transfers, isLoading: transfersLoading, createTransfer, updateTransfer, deleteTransfer } = useTransfers();
  const { wallets } = useWallets();
  const { categories } = useCategories();
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editingTransfer, setEditingTransfer] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStart, setFilterStart] = useState<Date | null>(null);
  const [filterEnd, setFilterEnd] = useState<Date | null>(null);
  const [transactionFormData, setTransactionFormData] = useState({
    reason: '',
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    wallet_id: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    nepali_date: ''
  });
  const [transferFormData, setTransferFormData] = useState({
    from_wallet_id: '',
    to_wallet_id: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const unifiedData = useMemo(() => {
    const transactionItems: UnifiedTransaction[] = transactions.map(t => ({
      id: t.id,
      type: 'transaction',
      subtype: t.type,
      reason: t.reason,
      amount: t.income || t.expense || 0,
      wallet_id: t.wallet_id,
      category_id: t.category_id,
      date: t.date,
      nepali_date: t.nepali_date,
      created_at: t.created_at
    }));

    const transferItems: UnifiedTransaction[] = transfers.map(t => ({
      id: t.id,
      type: 'transfer',
      description: t.description,
      amount: t.amount,
      from_wallet_id: t.from_wallet_id,
      to_wallet_id: t.to_wallet_id,
      date: t.date,
      created_at: t.created_at
    }));

    return [...transactionItems, ...transferItems].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, transfers]);

  // Calculate running balances and previous balances for each transaction/transfer
  const { runningBalances, previousBalances, toWalletRunningBalances, toWalletPreviousBalances } = useMemo(() => {
    const runningMap = new Map<string, number>();
    const previousMap = new Map<string, number>();
    const toWalletRunningMap = new Map<string, number>();
    const toWalletPreviousMap = new Map<string, number>();
    
    // Get current wallet balances
    const walletBalances = new Map<string, number>();
    wallets.forEach(w => walletBalances.set(w.id, w.balance));
    
    // Sort transactions by date (newest first) to calculate backwards
    const sortedData = [...unifiedData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // For each transaction, calculate balance AFTER and BEFORE this transaction
    const runningWalletBalances = new Map<string, number>();
    wallets.forEach(w => runningWalletBalances.set(w.id, w.balance));
    
    sortedData.forEach(item => {
      if (item.type === 'transaction' && item.wallet_id) {
        const currentBalance = runningWalletBalances.get(item.wallet_id) || 0;
        runningMap.set(`${item.type}-${item.id}`, currentBalance);
        
        // Calculate previous balance (before this transaction)
        let prevBalance: number;
        if (item.subtype === 'income') {
          prevBalance = currentBalance - item.amount;
        } else {
          prevBalance = currentBalance + item.amount;
        }
        previousMap.set(`${item.type}-${item.id}`, prevBalance);
        
        // Update running wallet balance for next iteration
        runningWalletBalances.set(item.wallet_id, prevBalance);
      } else if (item.type === 'transfer') {
        // For transfers, show from_wallet balance after transfer
        const fromBalance = runningWalletBalances.get(item.from_wallet_id!) || 0;
        runningMap.set(`${item.type}-${item.id}`, fromBalance);
        
        // Calculate previous balance for from_wallet
        const prevFromBalance = fromBalance + item.amount;
        previousMap.set(`${item.type}-${item.id}`, prevFromBalance);
        
        // Track to_wallet balance too
        const toBalance = runningWalletBalances.get(item.to_wallet_id!) || 0;
        toWalletRunningMap.set(`${item.type}-${item.id}`, toBalance);
        const prevToBalance = toBalance - item.amount;
        toWalletPreviousMap.set(`${item.type}-${item.id}`, prevToBalance);
        
        // Reverse the transfer for next iteration
        runningWalletBalances.set(item.from_wallet_id!, prevFromBalance);
        runningWalletBalances.set(item.to_wallet_id!, prevToBalance);
      }
    });
    
    return { runningBalances: runningMap, previousBalances: previousMap, toWalletRunningBalances: toWalletRunningMap, toWalletPreviousBalances: toWalletPreviousMap };
  }, [unifiedData, wallets]);

  const filteredData = useMemo(() => {
    return unifiedData.filter((item) => {
      const d = new Date(item.date);
      if (filterStart && d < new Date(filterStart.toDateString())) return false;
      if (filterEnd) {
        const end = new Date(filterEnd);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [unifiedData, filterStart, filterEnd]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(startIndex, endIndex);

  // Check for openModal parameter on component mount
  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      setIsTransactionDialogOpen(true);
      // Remove the parameter from URL
      searchParams.delete('openModal');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transactionData = {
      reason: transactionFormData.reason,
      type: transactionFormData.type,
      wallet_id: transactionFormData.wallet_id,
      category_id: transactionFormData.category_id || undefined,
      date: transactionFormData.date,
      nepali_date: transactionFormData.nepali_date, // Always include nepali_date in payload
      income: transactionFormData.type === 'income' ? transactionFormData.amount : undefined,
      expense: transactionFormData.type === 'expense' ? transactionFormData.amount : undefined
    };
    
    console.log('Submitting transaction data with nepali_date:', transactionData);
    
    if (editingTransaction) {
      updateTransaction.mutate({ id: editingTransaction.id, ...transactionData });
    } else {
      createTransaction.mutate(transactionData);
    }
    
    setIsTransactionDialogOpen(false);
    setEditingTransaction(null);
    setTransactionFormData({
      reason: '',
      type: 'expense',
      amount: 0,
      wallet_id: '',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
      nepali_date: ''
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTransfer) {
      updateTransfer.mutate({ id: editingTransfer.id, ...transferFormData });
    } else {
      createTransfer.mutate(transferFormData);
    }
    
    setIsTransferDialogOpen(false);
    setEditingTransfer(null);
    setTransferFormData({ from_wallet_id: '', to_wallet_id: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
  };

  const handleEditTransaction = (transaction: any) => {
    // Find the original transaction to get the nepali_date
    const originalTransaction = transactions.find(t => t.id === transaction.id);
    setEditingTransaction(originalTransaction || transaction);
    setTransactionFormData({
      reason: transaction.reason,
      type: transaction.type,
      amount: transaction.income || transaction.expense || 0,
      wallet_id: transaction.wallet_id,
      category_id: transaction.category_id || '',
      date: transaction.date,
      nepali_date: originalTransaction?.nepali_date || transaction.nepali_date || ''
    });
    setIsTransactionDialogOpen(true);
  };

  const handleEditTransfer = (transfer: any) => {
    setEditingTransfer(transfer);
    setTransferFormData({
      from_wallet_id: transfer.from_wallet_id,
      to_wallet_id: transfer.to_wallet_id,
      amount: transfer.amount,
      date: transfer.date,
      description: transfer.description || ''
    });
    setIsTransferDialogOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction.mutate(id);
    }
  };

  const handleDeleteTransfer = (id: string) => {
    if (confirm('Are you sure you want to delete this transfer?')) {
      deleteTransfer.mutate(id);
    }
  };

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'No Category';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#6B7280';
  };

  const isLoading = transactionsLoading || transfersLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700">Transactions & Transfers</h1>
          <p className="text-muted-foreground">Manage your income, expenses and transfers</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
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
          />

          <TransferForm
            isOpen={isTransferDialogOpen}
            setIsOpen={setIsTransferDialogOpen}
            editingTransfer={editingTransfer}
            setEditingTransfer={setEditingTransfer}
            formData={transferFormData}
            setFormData={setTransferFormData}
            onSubmit={handleTransferSubmit}
            wallets={wallets}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 flex-wrap">
        <CompactDateRangeFilter
          startDate={filterStart}
          endDate={filterEnd}
          onChange={(s, e) => { setFilterStart(s); setFilterEnd(e); setCurrentPage(1); }}
        />
        <CalendarModeToggle />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <TransactionsList
          currentItems={currentItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onEditTransfer={handleEditTransfer}
          onDeleteTransfer={handleDeleteTransfer}
          getWalletName={getWalletName}
          getCategoryName={getCategoryName}
          getCategoryColor={getCategoryColor}
          transactions={transactions}
          transfers={transfers}
           runningBalances={runningBalances}
           previousBalances={previousBalances}
           toWalletRunningBalances={toWalletRunningBalances}
           toWalletPreviousBalances={toWalletPreviousBalances}
        />
      )}
    </div>
  );
};

export default FinanceTransactions;
