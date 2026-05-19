
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NepaliDatePicker } from '@/components/ui/nepali-date-picker';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useWallets } from '@/hooks/useWallets';
import { useCurrency } from '@/hooks/useCurrency';
import { Search, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';

export const MonthVsMonth: React.FC = () => {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { wallets } = useWallets();
  const { formatAmount } = useCurrency();

  // Date range 1
  const [start1, setStart1] = useState('');
  const [end1, setEnd1] = useState('');
  const [nepaliStart1, setNepaliStart1] = useState('');
  const [nepaliEnd1, setNepaliEnd1] = useState('');

  // Date range 2
  const [start2, setStart2] = useState('');
  const [end2, setEnd2] = useState('');
  const [nepaliStart2, setNepaliStart2] = useState('');
  const [nepaliEnd2, setNepaliEnd2] = useState('');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');

  // Active filters (applied on search)
  const [activeFilters, setActiveFilters] = useState<{
    start1: string; end1: string; start2: string; end2: string;
    category: string; wallet: string;
  } | null>(null);

  const handleSearch = () => {
    setActiveFilters({
      start1, end1, start2, end2,
      category: selectedCategory,
      wallet: selectedWallet,
    });
  };

  const filterTransactions = (txns: typeof transactions, startDate: string, endDate: string) => {
    return txns.filter(t => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      if (activeFilters?.category !== 'all' && t.category_id !== activeFilters?.category) return false;
      if (activeFilters?.wallet !== 'all' && t.wallet_id !== activeFilters?.wallet) return false;
      return true;
    });
  };

  const stats = useMemo(() => {
    if (!activeFilters) return null;

    const range1 = filterTransactions(transactions, activeFilters.start1, activeFilters.end1);
    const range2 = filterTransactions(transactions, activeFilters.start2, activeFilters.end2);

    const calcStats = (txns: typeof transactions) => {
      const totalIncome = txns.reduce((s, t) => s + (t.income || 0), 0);
      const totalExpense = txns.reduce((s, t) => s + (t.expense || 0), 0);
      return { totalIncome, totalExpense, net: totalIncome - totalExpense, count: txns.length };
    };

    const s1 = calcStats(range1);
    const s2 = calcStats(range2);

    // Category breakdown
    const catBreakdown = categories.map(cat => {
      const c1 = range1.filter(t => t.category_id === cat.id);
      const c2 = range2.filter(t => t.category_id === cat.id);
      const exp1 = c1.reduce((s, t) => s + (t.expense || 0), 0);
      const exp2 = c2.reduce((s, t) => s + (t.expense || 0), 0);
      const inc1 = c1.reduce((s, t) => s + (t.income || 0), 0);
      const inc2 = c2.reduce((s, t) => s + (t.income || 0), 0);
      return { name: cat.name, color: cat.color, exp1, exp2, inc1, inc2, diff: exp2 - exp1 };
    }).filter(c => c.exp1 > 0 || c.exp2 > 0 || c.inc1 > 0 || c.inc2 > 0);

    return { s1, s2, catBreakdown, range1, range2 };
  }, [activeFilters, transactions, categories]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-green-700">Month vs Month</h1>
        <p className="text-muted-foreground text-sm">Compare spending across two date ranges</p>
      </div>

      <Card className="border-green-200">
        <CardHeader><CardTitle className="text-green-700">Date Range 1</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NepaliDatePicker label="Start Date" value={start1} onChange={(eng, nep) => { setStart1(eng); setNepaliStart1(nep); }} id="r1-start" />
            <NepaliDatePicker label="End Date" value={end1} onChange={(eng, nep) => { setEnd1(eng); setNepaliEnd1(nep); }} id="r1-end" />
          </div>
          {nepaliStart1 && nepaliEnd1 && (
            <p className="text-sm text-muted-foreground mt-2">BS: {nepaliStart1} → {nepaliEnd1}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader><CardTitle className="text-green-700">Date Range 2</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NepaliDatePicker label="Start Date" value={start2} onChange={(eng, nep) => { setStart2(eng); setNepaliStart2(nep); }} id="r2-start" />
            <NepaliDatePicker label="End Date" value={end2} onChange={(eng, nep) => { setEnd2(eng); setNepaliEnd2(nep); }} id="r2-end" />
          </div>
          {nepaliStart2 && nepaliEnd2 && (
            <p className="text-sm text-muted-foreground mt-2">BS: {nepaliStart2} → {nepaliEnd2}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader><CardTitle className="text-green-700">Filters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Wallet</Label>
              <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                <SelectTrigger><SelectValue placeholder="All Wallets" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wallets</SelectItem>
                  {wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700">
              <Search className="h-4 w-4 mr-2" />Compare
            </Button>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-green-200">
              <CardHeader><CardTitle className="text-green-700 text-lg">Range 1</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span>Income</span><span className="text-green-600 font-semibold">{formatAmount(stats.s1.totalIncome)}</span></div>
                <div className="flex justify-between"><span>Expense</span><span className="text-red-600 font-semibold">{formatAmount(stats.s1.totalExpense)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-semibold">Net</span><span className={`font-bold ${stats.s1.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(stats.s1.net)}</span></div>
                <p className="text-sm text-muted-foreground">{stats.s1.count} transactions</p>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardHeader><CardTitle className="text-green-700 text-lg">Range 2</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span>Income</span><span className="text-green-600 font-semibold">{formatAmount(stats.s2.totalIncome)}</span></div>
                <div className="flex justify-between"><span>Expense</span><span className="text-red-600 font-semibold">{formatAmount(stats.s2.totalExpense)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-semibold">Net</span><span className={`font-bold ${stats.s2.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(stats.s2.net)}</span></div>
                <p className="text-sm text-muted-foreground">{stats.s2.count} transactions</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-green-200">
            <CardHeader><CardTitle className="text-green-700">Difference</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Income Change</span>
                <Badge variant={stats.s2.totalIncome >= stats.s1.totalIncome ? 'default' : 'destructive'}>
                  {stats.s2.totalIncome >= stats.s1.totalIncome ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {formatAmount(stats.s2.totalIncome - stats.s1.totalIncome)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Expense Change</span>
                <Badge variant={stats.s2.totalExpense <= stats.s1.totalExpense ? 'default' : 'destructive'}>
                  {stats.s2.totalExpense <= stats.s1.totalExpense ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                  {formatAmount(stats.s2.totalExpense - stats.s1.totalExpense)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {stats.catBreakdown.length > 0 && (
            <Card className="border-green-200">
              <CardHeader><CardTitle className="text-green-700">Category Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.catBreakdown.map(cat => (
                    <div key={cat.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span>R1: {formatAmount(cat.exp1)}</span>
                        <span>R2: {formatAmount(cat.exp2)}</span>
                        <span className={cat.diff <= 0 ? 'text-green-600' : 'text-red-600'}>
                          {cat.diff > 0 ? '+' : ''}{formatAmount(cat.diff)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MonthVsMonth;
