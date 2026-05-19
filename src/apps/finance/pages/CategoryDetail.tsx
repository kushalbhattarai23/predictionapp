
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, TrendingUp, TrendingDown, Calendar, ArrowUp, ArrowDown, ArrowLeft, Edit, Trash2, Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useCurrency } from '@/hooks/useCurrency';
import { TransactionForm } from '@/apps/finance/components/TransactionForm';
import { CompactDateRangeFilter } from '@/apps/finance/components/CompactDateRangeFilter';
import { CalendarModeToggle } from '@/apps/finance/components/CalendarModeToggle';
import { useCalendarMode, formatDateByMode } from '@/apps/finance/hooks/useCalendarMode';
import { useToast } from '@/hooks/use-toast';

export const CategoryDetail: React.FC = () => {
  const { id: categorySlug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { transactions, createTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();

  // Find category by slug (name)
  const category = categories.find(c => 
    c.name.toLowerCase() === decodeURIComponent(categorySlug || '').toLowerCase()
  );
  const categoryId = category?.id;

  // Edit transaction state
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transactionFormData, setTransactionFormData] = useState({
    reason: '',
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    wallet_id: '',
    category_id: categoryId || '',
    date: new Date().toISOString().split('T')[0],
    nepali_date: ''
  });

  const [filterStart, setFilterStart] = useState<Date | null>(null);
  const { mode: calendarMode } = useCalendarMode();
  const [filterEnd, setFilterEnd] = useState<Date | null>(null);

  const categoryTransactions = transactions
    .filter(t => t.category_id === categoryId)
    .filter(t => {
      const d = new Date(t.date);
      if (filterStart && d < new Date(filterStart.toDateString())) return false;
      if (filterEnd) {
        const end = new Date(filterEnd);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setTransactionFormData({
      reason: '',
      type: 'expense',
      amount: 0,
      wallet_id: wallets.length > 0 ? wallets[0].id : '',
      category_id: categoryId || '',
      date: new Date().toISOString().split('T')[0],
      nepali_date: ''
    });
    setIsTransactionDialogOpen(true);
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
    
    if (editingTransaction) {
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
    } else {
      createTransaction.mutate(transactionData, {
        onSuccess: () => {
          toast({ title: 'Transaction created successfully' });
          setIsTransactionDialogOpen(false);
          resetFormData();
        },
        onError: (error: Error) => {
          toast({ title: 'Failed to create transaction', description: error.message, variant: 'destructive' });
        }
      });
    }
  };

  const resetFormData = () => {
    setTransactionFormData({
      reason: '',
      type: 'expense',
      amount: 0,
      wallet_id: wallets.length > 0 ? wallets[0].id : '',
      category_id: categoryId || '',
      date: new Date().toISOString().split('T')[0],
      nepali_date: ''
    });
  };

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border-red-200">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Category Not Found</h3>
            <p className="text-muted-foreground">The category you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate income and expense totals separately
  const totalIncome = categoryTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.income || 0), 0);
  
  const totalExpense = categoryTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.expense || 0), 0);

  const netAmount = totalIncome - totalExpense;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Transaction Form Dialog (for editing only) */}
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

      {/* Category Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700 flex items-center gap-2">
            <Tag className="h-8 w-8" style={{ color: category.color }} />
            {category.name}
          </h1>
          <p className="text-muted-foreground">Category transactions and analytics</p>
        </div>
        <Button onClick={handleAddTransaction} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{formatAmount(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryTransactions.filter(t => t.type === 'income').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatAmount(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryTransactions.filter(t => t.type === 'expense').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
            <Tag className="h-4 w-4" style={{ color: category.color }} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netAmount >= 0 ? '+' : ''}{formatAmount(netAmount)}
            </div>
            <Badge variant="outline" style={{ borderColor: category.color, color: category.color }}>
              {category.name}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {categoryTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatAmount(categoryTransactions.length > 0 ? (totalIncome + totalExpense) / categoryTransactions.length : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2 flex-wrap">
        <CompactDateRangeFilter
          startDate={filterStart}
          endDate={filterEnd}
          onChange={(s, e) => { setFilterStart(s); setFilterEnd(e); }}
        />
        <CalendarModeToggle />
      </div>

      {/* Transactions List */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found for this category
            </div>
          ) : (
            <div className="space-y-3">
              {categoryTransactions.map((transaction) => (
                <Card key={transaction.id} className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {transaction.type === 'income' ? (
                            <ArrowUp className="h-8 w-8 text-green-500" />
                          ) : (
                            <ArrowDown className="h-8 w-8 text-red-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                              {transaction.type}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer" 
                              onClick={() => navigate(`/finance/wallet/${transaction.wallet_id}`)}
                            >
                              <Wallet className="h-3 w-3 mr-1" />
                              {getWalletName(transaction.wallet_id)}
                            </Badge>
                          </div>
                          <p className="font-semibold text-green-700 truncate">
                            {transaction.reason}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {formatDateByMode(transaction.date, transaction.nepali_date, calendarMode)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="text-left sm:text-right">
                          <p className={`text-xl font-bold ${
                            transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatAmount(transaction.income || transaction.expense || 0)}
                          </p>
                        </div>
                        <div className="flex space-x-1">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryDetail;
