import React from 'react';
import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type BudgetLike = {
  amount: number;
  category_id?: string | null;
};

type TransactionLike = {
  type: 'income' | 'expense' | string;
  expense?: number | null;
  income?: number | null;
  date?: string;
  category_id?: string | null;
};

type MonthlyBudgetOverviewParams = {
  budgets: BudgetLike[];
  transactions: TransactionLike[];
  isTransactionInPeriod: (transaction: TransactionLike) => boolean;
};

export const calculateMonthlyBudgetOverview = ({
  budgets,
  transactions,
  isTransactionInPeriod,
}: MonthlyBudgetOverviewParams) => {
  const monthlyTotalBudget = budgets.find((budget) => !budget.category_id);
  const totalMonthlyBudget = monthlyTotalBudget
    ? monthlyTotalBudget.amount
    : budgets.reduce((sum, budget) => sum + budget.amount, 0);

  // Group by category, then only include categories where expense > 0
  const categoryTotals: Record<string, { expense: number; income: number }> = {};
  transactions
    .filter((transaction) => isTransactionInPeriod(transaction))
    .forEach((t) => {
      const key = (t as any).category_id || 'uncategorized';
      if (!categoryTotals[key]) categoryTotals[key] = { expense: 0, income: 0 };
      if (t.type === 'expense') categoryTotals[key].expense += t.expense || 0;
      if (t.type === 'income') categoryTotals[key].income += (t as any).income || 0;
    });

  // Net Spent = sum of (expense - income) only for categories where expense > 0
  const totalMonthlySpent = Object.values(categoryTotals)
    .filter((cat) => cat.expense > 0)
    .reduce((sum, cat) => sum + (cat.expense - cat.income), 0);

  const monthlyBudgetRemaining = totalMonthlyBudget - totalMonthlySpent;
  const monthlyProgressPercentage = totalMonthlyBudget > 0
    ? (totalMonthlySpent / totalMonthlyBudget) * 100
    : 0;

  return {
    totalMonthlyBudget,
    totalMonthlySpent,
    monthlyBudgetRemaining,
    monthlyProgressPercentage,
  };
};

type MonthlyBudgetOverviewCardProps = {
  totalMonthlyBudget: number;
  totalMonthlySpent: number;
  monthlyBudgetRemaining: number;
  monthlyProgressPercentage: number;
  formatAmount: (amount: number) => string;
};

export const MonthlyBudgetOverviewCard: React.FC<MonthlyBudgetOverviewCardProps> = ({
  totalMonthlyBudget,
  totalMonthlySpent,
  monthlyBudgetRemaining,
  monthlyProgressPercentage,
  formatAmount,
}) => (
  <Card className="border-green-200">
    <CardHeader>
      <CardTitle className="text-green-700 flex items-center">
        <Target className="h-5 w-5 mr-2" />
        Monthly Budget Overview
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Budget</p>
          <p className="text-2xl font-bold text-green-700">{formatAmount(totalMonthlyBudget)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Net Spent</p>
          <p className="text-2xl font-bold text-red-600">{formatAmount(totalMonthlySpent)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className={`text-2xl font-bold ${monthlyBudgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(monthlyBudgetRemaining)}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Monthly Progress</span>
          <span>{monthlyProgressPercentage.toFixed(1)}%</span>
        </div>
        <Progress
          value={Math.min(monthlyProgressPercentage, 100)}
          color={monthlyProgressPercentage > 100 ? 'red' : 'green'}
          className={`h-3 ${monthlyProgressPercentage > 100 ? 'bg-red-100' : 'bg-green-100'}`}
        />
      </div>
    </CardContent>
  </Card>
);
