
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Target,
  Building2,
  User
} from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useCurrency } from '@/hooks/useCurrency';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { MonthlyBudgetOverviewCard, calculateMonthlyBudgetOverview } from '@/apps/finance/components/MonthlyBudgetOverviewCard';

export const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { wallets } = useWallets();
  const { transactions } = useTransactions();
  const { formatAmount } = useCurrency();
  const { currentOrganization, isPersonalMode } = useOrganizationContext();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const { budgets } = useBudgets(currentMonth, currentYear);

  // Calculate totals from the data (now properly filtered by organization in hooks)
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth - 1 && transactionDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.income || 0), 0);
    
  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.expense || 0), 0);
    
  const savings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? Math.round((savings / monthlyIncome) * 100) : 0;

  const budgetOverview = calculateMonthlyBudgetOverview({
    budgets,
    transactions,
    isTransactionInPeriod: (transaction) => {
      const transactionDate = new Date(transaction.date || '');
      return transactionDate.getMonth() === currentMonth - 1 && transactionDate.getFullYear() === currentYear;
    },
  });

  const recentTransactions = transactions.slice(0, 5);

  const handleAddTransaction = () => {
    navigate('/finance/transactions?openModal=true');
  };

  const dashboardTitle = isPersonalMode ? 'Personal Finance Dashboard' : `${currentOrganization?.name} Dashboard`;
  const dashboardSubtitle = isPersonalMode 
    ? 'Track your personal financial health and manage your money'
    : `Manage finances for ${currentOrganization?.name}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {isPersonalMode ? (
              <User className="h-8 w-8 text-green-600" />
            ) : (
              <Building2 className="h-8 w-8 text-blue-600" />
            )}
            <h1 className="text-3xl font-bold text-green-700">{dashboardTitle}</h1>
          </div>
          <p className="text-muted-foreground">{dashboardSubtitle}</p>
          {!isPersonalMode && (
            <Badge variant="outline" className="mt-2">
              Company Mode: {currentOrganization?.name}
            </Badge>
          )}
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddTransaction}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatAmount(totalBalance)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(monthlyIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatAmount(monthlyExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(savings)}
            </div>
            <p className="text-xs text-muted-foreground">
              {savingsRate}% savings rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget-based Spending Progress */}
      {budgets.length > 0 ? (
        <MonthlyBudgetOverviewCard
          totalMonthlyBudget={budgetOverview.totalMonthlyBudget}
          totalMonthlySpent={budgetOverview.totalMonthlySpent}
          monthlyBudgetRemaining={budgetOverview.monthlyBudgetRemaining}
          monthlyProgressPercentage={budgetOverview.monthlyProgressPercentage}
          formatAmount={formatAmount}
        />
      ) : (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Monthly Savings Progress</CardTitle>
            <CardDescription>
              Saved {formatAmount(savings)} out of {formatAmount(monthlyIncome)} income
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={Math.max(0, savingsRate)} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{savingsRate}% saved</span>
              <span>Target: 30%</span>
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/finance/budgets')}
                className="mt-2"
              >
                <Target className="mr-2 h-4 w-4" />
                Create Budget to Track Goals
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallets and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Wallets</CardTitle>
            <CardDescription>Your account balances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wallets.length === 0 ? (
              <p className="text-muted-foreground">
                {isPersonalMode 
                  ? "No personal wallets found. Create your first wallet!" 
                  : `No wallets found for ${currentOrganization?.name}. Create your first company wallet!`
                }
              </p>
            ) : (
              wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="font-medium">{wallet.name}</span>
                  </div>
                  <span className="font-semibold text-green-700">
                    {formatAmount(wallet.balance)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <p className="text-muted-foreground">
                  {isPersonalMode 
                    ? "No personal transactions found. Add your first transaction!" 
                    : `No transactions found for ${currentOrganization?.name}. Add your first company transaction!`
                  }
                </p>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{transaction.reason}</p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatAmount(transaction.income || transaction.expense || 0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;
