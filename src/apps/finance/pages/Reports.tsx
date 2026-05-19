import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';
import { useTransfers } from '@/hooks/useTransfers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { SavingsRateTrendChart } from '@/apps/finance/components/SavingsRateTrendChart';
import { CategoryBurnRateChart } from '@/apps/finance/components/CategoryBurnRateChart';

const COLORS = ['#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'];

export const FinanceReports: React.FC = () => {
  const { transactions } = useTransactions();
  const { wallets } = useWallets();
  const { categories } = useCategories();
  const { transfers } = useTransfers();
  const [selectedReport, setSelectedReport] = useState('categories');
  const [pendingStartDate, setPendingStartDate] = useState<Date | null>(null);
  const [pendingEndDate, setPendingEndDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setPendingStartDate(start);
    setPendingEndDate(end);
    if (!start && !end) {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleSearch = () => {
    setStartDate(pendingStartDate);
    setEndDate(pendingEndDate);
  };

  // Filter data based on selected date range
  const getFilteredTransactions = () => {
    let filtered = transactions;
    
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= endDate);
    }
    
    return filtered;
  };

  const getFilteredTransfers = () => {
    let filtered = transfers;
    
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= endDate);
    }
    
    return filtered;
  };

  // Categories Report - Expenses
  const getCategoriesExpenseData = () => {
    const filteredTransactions = getFilteredTransactions();
    const categorySpending = categories.map(category => {
      const categoryTransactions = filteredTransactions.filter(t => t.category_id === category.id && t.type === 'expense');
      const total = categoryTransactions.reduce((sum, t) => sum + (t.expense || 0), 0);
      return {
        name: category.name,
        amount: total,
        color: category.color
      };
    }).filter(item => item.amount > 0);
    
    return categorySpending;
  };

  // Categories Report - Income
  const getCategoriesIncomeData = () => {
    const filteredTransactions = getFilteredTransactions();
    const categoryIncome = categories.map(category => {
      const categoryTransactions = filteredTransactions.filter(t => t.category_id === category.id && t.type === 'income');
      const total = categoryTransactions.reduce((sum, t) => sum + (t.income || 0), 0);
      return {
        name: category.name,
        amount: total,
        color: category.color
      };
    }).filter(item => item.amount > 0);
    
    return categoryIncome;
  };

  // Wallets Report
  const getWalletsData = () => {
    const filteredTransactions = getFilteredTransactions();
    return wallets.map(wallet => ({
      name: wallet.name,
      balance: wallet.balance,
      transactions: filteredTransactions.filter(t => t.wallet_id === wallet.id).length
    }));
  };

  // Income vs Expense
  const getIncomeExpenseData = () => {
    const filteredTransactions = getFilteredTransactions();
    const months = [...new Set(filteredTransactions.map(t => new Date(t.date).toISOString().slice(0, 7)))].sort();
    
    return months.map(month => {
      const monthTransactions = filteredTransactions.filter(t => t.date.startsWith(month));
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.income || 0), 0);
      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.expense || 0), 0);
      
      return {
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income,
        expense
      };
    });
  };

  // Monthly Report
  const getMonthlyData = () => {
    return getIncomeExpenseData().map(item => ({
      ...item,
      net: item.income - item.expense
    }));
  };

  // Transfers Report
  const getTransfersData = () => {
    const filteredTransfers = getFilteredTransfers();
    return filteredTransfers.map(transfer => {
      const fromWallet = wallets.find(w => w.id === transfer.from_wallet_id);
      const toWallet = wallets.find(w => w.id === transfer.to_wallet_id);
      return {
        from: fromWallet?.name || 'Unknown',
        to: toWallet?.name || 'Unknown',
        amount: transfer.amount,
        date: new Date(transfer.date).toLocaleDateString()
      };
    });
  };

  const renderReport = () => {
    const filteredTransactions = getFilteredTransactions();
    
    switch (selectedReport) {
      case 'categories':
        const categoriesExpenseData = getCategoriesExpenseData();
        const categoriesIncomeData = getCategoriesIncomeData();
        return (
          <div className="space-y-8">
            {/* Spending by Category */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-700">Spending by Category</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-700">Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoriesExpenseData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          label={({ name, value }) => `${name}: रु ${value.toLocaleString()}`}
                        >
                          {categoriesExpenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `रु ${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-700">Expense Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoriesExpenseData.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="font-semibold text-red-600">रु {category.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Income by Category */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-700">Income by Category</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-700">Income Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoriesIncomeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          label={({ name, value }) => `${name}: रु ${value.toLocaleString()}`}
                        >
                          {categoriesIncomeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `रु ${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-700">Income Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoriesIncomeData.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="font-semibold text-green-600">रु {category.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'wallets':
        const walletsData = getWalletsData();
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Wallet Balances and Activity</h3>
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Wallet Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={walletsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `रु ${value.toLocaleString()}`} />
                    <Bar dataKey="balance" fill="#22C55E" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Detailed Transaction Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700">Total Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-700">{filteredTransactions.length}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-700">
                    रु {filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.income || 0), 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    रु {filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.expense || 0), 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'income-expense':
        const incomeExpenseData = getIncomeExpenseData();
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Income and Expense Trends</h3>
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={incomeExpenseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `रु ${value.toLocaleString()}`} />
                    <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );

      case 'monthly':
        const monthlyData = getMonthlyData();
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Month-by-Month Breakdown</h3>
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Net Income by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `रु ${value.toLocaleString()}`} />
                    <Bar dataKey="net" fill="#22C55E" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );

      case 'transfers':
        const transfersData = getTransfersData();
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Wallet Transfer Analysis</h3>
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Recent Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transfersData.slice(0, 10).map((transfer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-medium">{transfer.from} → {transfer.to}</p>
                        <p className="text-sm text-muted-foreground">{transfer.date}</p>
                      </div>
                      <span className="font-semibold text-green-700">रु {transfer.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'savings-rate':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Savings Rate Analysis</h3>
            <SavingsRateTrendChart transactions={filteredTransactions} />
          </div>
        );

      case 'burn-rate':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Category Burn Rate Analysis</h3>
            <CategoryBurnRateChart transactions={filteredTransactions} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Reports</h1>
          <p className="text-muted-foreground">Analyze your financial data</p>
        </div>
        
        <Select value={selectedReport} onValueChange={setSelectedReport}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="categories">Categories Report</SelectItem>
            <SelectItem value="wallets">Wallets Report</SelectItem>
            <SelectItem value="transactions">Transactions Report</SelectItem>
            <SelectItem value="income-expense">Income vs Expense</SelectItem>
            <SelectItem value="monthly">Monthly Report</SelectItem>
            <SelectItem value="transfers">Transfers Report</SelectItem>
            <SelectItem value="savings-rate">Savings Rate Trend</SelectItem>
            <SelectItem value="burn-rate">Category Burn Rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangeFilter
            startDate={pendingStartDate}
            endDate={pendingEndDate}
            onDateRangeChange={handleDateRangeChange}
            onSearch={handleSearch}
          />
        </CardContent>
      </Card>
      
      {renderReport()}
    </div>
  );
};

export default FinanceReports;
