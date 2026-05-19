import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useCurrency } from '@/hooks/useCurrency';
import { format, getDaysInMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, X, TrendingDown, TrendingUp, ArrowRight, Wallet, Edit } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { convertEnglishToNepali, convertNepaliToEnglish, formatNepaliDate } from '@/utils/dateConverter';

const WEEKDAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const NEPALI_MONTHS = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'असोज',
  'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'
];

const NEPALI_MONTH_DAYS: Record<number, number[]> = {
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2081: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2082: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
};

const getNepaliDaysInMonth = (year: number, month: number): number => {
  const yearData = NEPALI_MONTH_DAYS[year];
  if (yearData && month >= 1 && month <= 12) return yearData[month - 1];
  return 30;
};

const HEATMAP_COLORS = [
  'hsl(0 0% 95%)',
  'hsl(90 54% 73%)',
  'hsl(110 44% 61%)',
  'hsl(136 63% 41%)',
  'hsl(140 60% 24%)',
];

const getHeatLevel = (expense: number, maxExpense: number): number => {
  if (expense === 0 || maxExpense === 0) return 0;
  const ratio = expense / maxExpense;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

interface DayData {
  day: number;
  date: string;
  expense: number;
  income: number;
  dayOfWeek: number;
  dayName: string;
  nepaliDate: string;
  categories: Record<string, number>;
  transactions: { id: string; reason: string; amount: number; type: string; walletName: string; walletId: string; previousBalance: number; currentBalance: number }[];
}

const WalletCalendarHeatmap: React.FC = () => {
  const { transactions } = useTransactions();
  const { wallets } = useWallets();
  const { currency } = useCurrency();
  const navigate = useNavigate();

  const now = new Date();
  const currentNepali = convertEnglishToNepali(now);

  const [calendarMode, setCalendarMode] = useState<'english' | 'nepali'>('english');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [nepaliYear, setNepaliYear] = useState(currentNepali.year);
  const [nepaliMonth, setNepaliMonth] = useState(currentNepali.month);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>([]);

  const toggleWallet = (id: string) => {
    setSelectedWalletIds(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const filteredTransactions = useMemo(() => {
    if (selectedWalletIds.length === 0) return transactions;
    return transactions.filter(tx => selectedWalletIds.includes(tx.wallet_id));
  }, [transactions, selectedWalletIds]);

  const navigateMonth = (dir: number) => {
    if (calendarMode === 'english') {
      const d = new Date(selectedYear, selectedMonth + dir, 1);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
    } else {
      let nm = nepaliMonth + dir;
      let ny = nepaliYear;
      if (nm > 12) { nm = 1; ny++; }
      if (nm < 1) { nm = 12; ny--; }
      setNepaliMonth(nm);
      setNepaliYear(ny);
    }
    setSelectedDay(null);
  };

  // Compute wallet balances up to each date for running balance calculation
  const walletRunningBalances = useMemo(() => {
    // Sort ALL transactions (not filtered) by date ascending, then created_at
    const sorted = [...transactions].sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      return a.created_at.localeCompare(b.created_at);
    });

    // Build a map: walletId -> array of { date, txIndex, balanceBefore, balanceAfter }
    const walletBalances: Record<string, number> = {};
    const txBalanceMap: Record<string, { previous: number; current: number }> = {};

    for (const tx of sorted) {
      const wId = tx.wallet_id;
      if (!walletBalances[wId]) {
        const wallet = wallets.find(w => w.id === wId);
        // We need to work backwards from current balance, but simpler: compute forward from 0
        // Actually we don't know initial balance. Let's compute relative changes.
        walletBalances[wId] = 0;
      }
    }

    // Better approach: compute running balance per wallet using wallet's current balance minus future transactions
    // Sort descending to compute backwards
    const sortedDesc = [...transactions].sort((a, b) => {
      const dateComp = b.date.localeCompare(a.date);
      if (dateComp !== 0) return dateComp;
      return b.created_at.localeCompare(a.created_at);
    });

    const walletCurrentBalance: Record<string, number> = {};
    for (const w of wallets) {
      walletCurrentBalance[w.id] = w.balance || 0;
    }

    // Walk backwards: after each tx, the balance before that tx = currentBal reversed
    const tempBalances = { ...walletCurrentBalance };
    for (const tx of sortedDesc) {
      const wId = tx.wallet_id;
      if (tempBalances[wId] === undefined) continue;
      const currentBal = tempBalances[wId];
      let previousBal: number;
      if (tx.type === 'income') {
        previousBal = currentBal - (tx.income || 0);
      } else {
        previousBal = currentBal + (tx.expense || 0);
      }
      txBalanceMap[tx.id] = { previous: previousBal, current: currentBal };
      tempBalances[wId] = previousBal;
    }

    return txBalanceMap;
  }, [transactions, wallets]);

  const dailyData = useMemo(() => {
    const buildDay = (day: number, dateStr: string, dateObj: Date, dayOfWeek: number, nepaliDateStr: string): DayData => {
      const catMap: Record<string, number> = {};
      const txList: DayData['transactions'] = [];
      let expense = 0, income = 0;

      filteredTransactions.forEach((tx) => {
        const d = tx.date?.split('T')[0];
        if (d === dateStr) {
          if (tx.type === 'expense') {
            expense += tx.expense || 0;
            const catName = tx.categories?.name || 'Uncategorized';
            catMap[catName] = (catMap[catName] || 0) + (tx.expense || 0);
          } else {
            income += tx.income || 0;
          }
          const balInfo = walletRunningBalances[tx.id];
          txList.push({
            id: tx.id,
            reason: tx.reason,
            amount: tx.type === 'expense' ? (tx.expense || 0) : (tx.income || 0),
            type: tx.type,
            walletName: tx.wallets?.name || 'Unknown',
            walletId: tx.wallet_id,
            previousBalance: balInfo?.previous ?? 0,
            currentBalance: balInfo?.current ?? 0,
          });
        }
      });

      return { day, date: dateStr, expense, income, dayOfWeek, dayName: DAY_NAMES[dayOfWeek], nepaliDate: nepaliDateStr, categories: catMap, transactions: txList };
    };

    if (calendarMode === 'english') {
      const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth, 1));
      const days: DayData[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(selectedYear, selectedMonth, day);
        const nepali = convertEnglishToNepali(dateObj);
        days.push(buildDay(day, dateStr, dateObj, dateObj.getDay(), formatNepaliDate(nepali.year, nepali.month, nepali.day)));
      }
      return days;
    } else {
      const daysInMonth = getNepaliDaysInMonth(nepaliYear, nepaliMonth);
      const days: DayData[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        let dateObj: Date;
        let dayOfWeek = 0;
        try {
          dateObj = convertNepaliToEnglish(nepaliYear, nepaliMonth, day);
          dayOfWeek = dateObj.getDay();
        } catch {
          dateObj = new Date();
        }
        const dateStr = format(dateObj, 'yyyy-MM-dd');
        days.push(buildDay(day, dateStr, dateObj, dayOfWeek, formatNepaliDate(nepaliYear, nepaliMonth, day)));
      }
      return days;
    }
  }, [filteredTransactions, calendarMode, selectedYear, selectedMonth, nepaliYear, nepaliMonth, walletRunningBalances]);

  const maxExpense = Math.max(...dailyData.map(d => d.expense), 1);

  const calendarGrid = useMemo(() => {
    if (dailyData.length === 0) return [];
    const firstDayOfWeek = dailyData[0].dayOfWeek;
    const grid: (DayData | null)[][] = [];
    let week: (DayData | null)[] = Array(firstDayOfWeek).fill(null);
    dailyData.forEach((d) => {
      week.push(d);
      if (week.length === 7) { grid.push(week); week = []; }
    });
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      grid.push(week);
    }
    return grid;
  }, [dailyData]);

  const isToday = (d: DayData) => calendarMode === 'english' && d.date === format(now, 'yyyy-MM-dd');

  const sortedCategories = useMemo(() => {
    if (!selectedDay) return [];
    return Object.entries(selectedDay.categories).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [selectedDay]);

  const net = selectedDay ? selectedDay.income - selectedDay.expense : 0;

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
          Wallet Calendar<br />Heatmap
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Filter by wallet to see spending patterns for specific accounts.
        </p>
      </div>

      {/* Wallet Selector */}
      <div className="bg-card rounded-2xl p-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5" />
          Select Wallets
        </p>
        <div className="flex flex-wrap gap-2">
          {wallets.map((w) => {
            const isActive = selectedWalletIds.includes(w.id);
            return (
              <button
                key={w.id}
                onClick={() => toggleWallet(w.id)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground'}
                `}
              >
                {w.name}
              </button>
            );
          })}
          {wallets.length === 0 && (
            <p className="text-sm text-muted-foreground">No wallets found. Create a wallet first.</p>
          )}
          {selectedWalletIds.length > 0 && (
            <button
              onClick={() => { setSelectedWalletIds([]); setSelectedDay(null); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
            >
              Clear All
            </button>
          )}
        </div>
        {selectedWalletIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing data for {selectedWalletIds.length} wallet{selectedWalletIds.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Heatmap */}
        <div className="flex-1 space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2 shadow-sm">
              <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-accent rounded-md transition-colors">
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              {calendarMode === 'english' ? (
                <div className="flex items-center gap-2">
                  <Select value={String(selectedMonth)} onValueChange={(v) => { setSelectedMonth(parseInt(v)); setSelectedDay(null); }}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-foreground min-w-[110px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>{format(new Date(selectedYear, i, 1), 'MMMM')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(selectedYear)} onValueChange={(v) => { setSelectedYear(parseInt(v)); setSelectedDay(null); }}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-foreground min-w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Select value={String(nepaliMonth)} onValueChange={(v) => { setNepaliMonth(parseInt(v)); setSelectedDay(null); }}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-foreground min-w-[110px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NEPALI_MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(nepaliYear)} onValueChange={(v) => { setNepaliYear(parseInt(v)); setSelectedDay(null); }}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-foreground min-w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => currentNepali.year - 5 + i).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-accent rounded-md transition-colors">
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nepali</span>
              <Switch checked={calendarMode === 'nepali'} onCheckedChange={(v) => setCalendarMode(v ? 'nepali' : 'english')} />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-card rounded-2xl p-4 md:p-6">
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAY_HEADERS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="space-y-1">
              {calendarGrid.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((cell, ci) => {
                    if (!cell) return <div key={ci} className="aspect-square rounded-sm" />;
                    const level = getHeatLevel(cell.expense, maxExpense);
                    const isSelected = selectedDay?.day === cell.day;
                    const isTodayCell = isToday(cell);
                    return (
                      <button
                        key={ci}
                        onClick={() => setSelectedDay(cell)}
                        className={`aspect-square rounded-sm relative flex items-start justify-end p-1.5 transition-all duration-200 hover:scale-105 cursor-pointer
                          ${isSelected ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background' : ''}
                          ${isTodayCell ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
                        style={{ backgroundColor: HEATMAP_COLORS[level] }}
                      >
                        <span className={`text-xs font-medium ${level >= 3 ? 'text-white' : 'text-foreground'}`}>{cell.day}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 mt-6 pt-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Spend Intensity</span>
              <span className="text-xs text-muted-foreground">LOW</span>
              <div className="flex gap-1">
                {HEATMAP_COLORS.slice(1).map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">HIGH</span>
            </div>
          </div>
        </div>

        {/* Right: Active Insight Panel */}
        <div className="w-full lg:w-[380px] shrink-0">
          {selectedDay ? (
            <div className="bg-card rounded-2xl p-6 space-y-5 sticky top-4">
              <div className="flex items-start justify-between">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Wallet Insight
                </span>
                <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {calendarMode === 'english' ? format(parseISO(selectedDay.date), 'MMM d, yyyy') : selectedDay.nepaliDate}
                </h2>
                <p className="text-sm text-muted-foreground">{selectedDay.dayName}'s Wallet Transactions</p>
              </div>

              {/* Spend / Income */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Spend</p>
                  <p className="text-xl font-bold text-destructive mt-1">{currency.symbol}{selectedDay.expense.toLocaleString()}</p>
                </div>
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Income</p>
                  <p className="text-xl font-bold text-primary mt-1">{currency.symbol}{selectedDay.income.toLocaleString()}</p>
                </div>
              </div>

              {/* Net */}
              <div className={`flex items-center justify-between rounded-xl p-4 ${net >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <div className="flex items-center gap-3">
                  {net >= 0 ? <TrendingUp className="h-5 w-5 text-primary" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
                  <span className="font-semibold text-foreground">{net >= 0 ? 'Net Surplus' : 'Net Deficit'}</span>
                </div>
                <span className={`font-bold text-lg ${net >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {net >= 0 ? '+' : '-'}{currency.symbol}{Math.abs(net).toLocaleString()}
                </span>
              </div>

              {/* Categories */}
              {sortedCategories.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full" />
                    Top Categories
                  </p>
                  {sortedCategories.map(([name, amount]) => (
                    <div key={name} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-foreground">{name}</span>
                      <span className="text-sm font-semibold text-foreground">{currency.symbol}{amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Transaction List */}
              {selectedDay.transactions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-4 bg-accent rounded-full" />
                    All Transactions ({selectedDay.transactions.length})
                  </p>
                  <div className="max-h-[240px] overflow-y-auto space-y-2">
                    {selectedDay.transactions.map((tx, i) => (
                      <div key={i} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{tx.reason}</p>
                          <p className="text-[10px] text-muted-foreground">{tx.walletName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {currency.symbol}{tx.previousBalance.toLocaleString()} → {currency.symbol}{tx.currentBalance.toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold ${tx.type === 'expense' ? 'text-destructive' : 'text-primary'}`}>
                          {tx.type === 'expense' ? '-' : '+'}{currency.symbol}{tx.amount.toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={() => navigate(`/finance/transactions?edit=${tx.id}`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button className="w-full rounded-xl h-12 font-semibold" onClick={() => navigate(`/finance/transactions?date=${selectedDay.date}`)}>
                View All Transactions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Select a day</p>
              <p className="text-xs text-muted-foreground">
                {selectedWalletIds.length === 0
                  ? 'Select wallets above, then click a day to see wallet-specific insights.'
                  : 'Click on any day to see wallet-filtered spending insights.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletCalendarHeatmap;
