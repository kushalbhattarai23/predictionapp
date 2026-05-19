import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useWallets } from '@/hooks/useWallets';
import { useTransfers } from '@/hooks/useTransfers';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'];

const NEPALI_MONTHS = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export const NepaliDateReport: React.FC = () => {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { wallets } = useWallets();
  const { transfers } = useTransfers();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState('overview');
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

  // Parse nepali_date "YYYY/MM/DD" to get year and month
  const parsedTransactions = useMemo(() => {
    let filtered = transactions.filter(t => t.nepali_date);
    
    // Apply date range filter on english date
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= endDate);
    }
    
    return filtered.map(t => {
      const parts = t.nepali_date!.split('/');
      return {
        ...t,
        nepaliYear: parseInt(parts[0]),
        nepaliMonth: parseInt(parts[1]),
        nepaliDay: parseInt(parts[2]),
      };
    });
  }, [transactions, startDate, endDate]);

  const availableYears = useMemo(() => {
    const years = [...new Set(parsedTransactions.map(t => t.nepaliYear))].sort((a, b) => b - a);
    return years;
  }, [parsedTransactions]);

  const filteredTransactions = useMemo(() => {
    if (selectedYear === 'all') return parsedTransactions;
    return parsedTransactions.filter(t => t.nepaliYear === parseInt(selectedYear));
  }, [parsedTransactions, selectedYear]);

  const filteredTransfers = useMemo(() => {
    let filtered = transfers;
    if (startDate) filtered = filtered.filter(t => new Date(t.date) >= startDate);
    if (endDate) filtered = filtered.filter(t => new Date(t.date) <= endDate);
    return filtered;
  }, [transfers, startDate, endDate]);

  // Monthly breakdown by Nepali months
  const monthlyData = useMemo(() => {
    return NEPALI_MONTHS.map((name, idx) => {
      const monthNum = idx + 1;
      const monthTxns = filteredTransactions.filter(t => t.nepaliMonth === monthNum);
      const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + (t.income || 0), 0);
      const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.expense || 0), 0);
      return { name, income, expense, net: income - expense, count: monthTxns.length };
    });
  }, [filteredTransactions]);

  // Category breakdown
  const categoryExpenseData = useMemo(() => {
    return categories.map(cat => {
      const catTxns = filteredTransactions.filter(t => t.category_id === cat.id && t.type === 'expense');
      const total = catTxns.reduce((s, t) => s + (t.expense || 0), 0);
      return { name: cat.name, amount: total, color: cat.color };
    }).filter(c => c.amount > 0);
  }, [filteredTransactions, categories]);

  const categoryIncomeData = useMemo(() => {
    return categories.map(cat => {
      const catTxns = filteredTransactions.filter(t => t.category_id === cat.id && t.type === 'income');
      const total = catTxns.reduce((s, t) => s + (t.income || 0), 0);
      return { name: cat.name, amount: total, color: cat.color };
    }).filter(c => c.amount > 0);
  }, [filteredTransactions, categories]);

  // Wallet data
  const walletsData = useMemo(() => {
    return wallets.map(wallet => ({
      name: wallet.name,
      balance: wallet.balance,
      transactions: filteredTransactions.filter(t => t.wallet_id === wallet.id).length
    }));
  }, [wallets, filteredTransactions]);

  // Transfers data
  const transfersData = useMemo(() => {
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
  }, [filteredTransfers, wallets]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.income || 0), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.expense || 0), 0);
  const txnsWithNepali = transactions.filter(t => t.nepali_date).length;
  const txnsWithout = transactions.length - txnsWithNepali;

  const renderReport = () => {
    switch (selectedReport) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">रु {totalIncome.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Expense</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">रु {totalExpense.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Net</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    रु {(totalIncome - totalExpense).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Chart */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Income & Expense by Nepali Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `रु ${value.toLocaleString()}`} />
                    <Bar dataKey="income" fill="#22C55E" name="Income" />
                    <Bar dataKey="expense" fill="#EF4444" name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-700">Expense by Category (Nepali Date)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-green-200">
                  <CardHeader><CardTitle className="text-green-700">Expense Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {categoryExpenseData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={categoryExpenseData} cx="50%" cy="50%" outerRadius={80} dataKey="amount"
                            label={({ name, value }) => `${name}: रु ${value.toLocaleString()}`}>
                            {categoryExpenseData.map((entry, i) => (
                              <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `रु ${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No expense data</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-green-200">
                  <CardHeader><CardTitle className="text-green-700">Expense Categories</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryExpenseData.map((cat, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <span className="font-semibold text-red-600">रु {cat.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-700">Income by Category (Nepali Date)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-green-200">
                  <CardHeader><CardTitle className="text-green-700">Income Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {categoryIncomeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={categoryIncomeData} cx="50%" cy="50%" outerRadius={80} dataKey="amount"
                            label={({ name, value }) => `${name}: रु ${value.toLocaleString()}`}>
                            {categoryIncomeData.map((entry, i) => (
                              <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `रु ${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No income data</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-green-200">
                  <CardHeader><CardTitle className="text-green-700">Income Categories</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryIncomeData.map((cat, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <span className="font-semibold text-green-600">रु {cat.amount.toLocaleString()}</span>
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
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Wallet Balances and Activity</h3>
            <Card className="border-green-200">
              <CardHeader><CardTitle className="text-green-700">Wallet Overview</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={walletsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `रु ${value.toLocaleString()}`} />
                    <Bar dataKey="balance" fill="#22C55E" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );

      case 'income-expense':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Income vs Expense by Nepali Month</h3>
            <Card className="border-green-200">
              <CardHeader><CardTitle className="text-green-700">Monthly Trends</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData.filter(m => m.count > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `रु ${value.toLocaleString()}`} />
                    <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );

      case 'monthly':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Nepali Month-by-Month Details</h3>
            <Card className="border-green-200">
              <CardHeader><CardTitle className="text-green-700">Net Income by Nepali Month</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData.filter(m => m.count > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `रु ${value.toLocaleString()}`} />
                    <Bar dataKey="net" fill="#22C55E" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardHeader><CardTitle className="text-green-700">Monthly Details</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {monthlyData.filter(m => m.count > 0).map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border border-green-200 rounded text-sm">
                      <span className="font-medium">{m.name}</span>
                      <div className="flex gap-4">
                        <span className="text-green-600">+रु {m.income.toLocaleString()}</span>
                        <span className="text-red-600">-रु {m.expense.toLocaleString()}</span>
                        <span className={`font-bold ${m.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          रु {m.net.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {monthlyData.filter(m => m.count > 0).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No transactions with Nepali dates</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'transfers':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-green-700">Wallet Transfer Analysis</h3>
            <Card className="border-green-200">
              <CardHeader><CardTitle className="text-green-700">Recent Transfers</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transfersData.length > 0 ? transfersData.slice(0, 10).map((transfer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-medium">{transfer.from} → {transfer.to}</p>
                        <p className="text-sm text-muted-foreground">{transfer.date}</p>
                      </div>
                      <span className="font-semibold text-green-700">रु {transfer.amount.toLocaleString()}</span>
                    </div>
                  )) : (
                    <p className="text-center text-muted-foreground py-8">No transfers in this period</p>
                  )}
                </div>
              </CardContent>
            </Card>
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
          <h1 className="text-3xl font-bold text-green-700">Nepali Date Report</h1>
          <p className="text-muted-foreground">
            Financial analysis based on Bikram Sambat calendar ({txnsWithNepali} with nepali dates, {txnsWithout} without)
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(y => (
                <SelectItem key={y} value={y.toString()}>{y} BS</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="categories">Categories Report</SelectItem>
              <SelectItem value="wallets">Wallets Report</SelectItem>
              <SelectItem value="income-expense">Income vs Expense</SelectItem>
              <SelectItem value="monthly">Monthly Report</SelectItem>
              <SelectItem value="transfers">Transfers Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

export default NepaliDateReport;
