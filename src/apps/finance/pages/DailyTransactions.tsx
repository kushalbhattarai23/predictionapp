import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import { format, startOfMonth, endOfMonth, subMonths, getDaysInMonth, parseISO } from 'date-fns';
import { Calendar, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { convertEnglishToNepali, convertNepaliToEnglish, formatNepaliDate } from '@/utils/dateConverter';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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
  return 30; // fallback
};

const DailyTransactions: React.FC = () => {
  const { transactions } = useTransactions();
  const { currency } = useCurrency();
  const navigate = useNavigate();

  const now = new Date();
  const currentNepali = convertEnglishToNepali(now);

  const [calendarMode, setCalendarMode] = useState<'english' | 'nepali'>('english');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [nepaliYear, setNepaliYear] = useState(currentNepali.year);
  const [nepaliMonth, setNepaliMonth] = useState(currentNepali.month);
  const [compareEnabled, setCompareEnabled] = useState(true);

  const currentDate = new Date(selectedYear, selectedMonth, 1);
  const prevDate = subMonths(currentDate, 1);

  // Group transactions by day for English mode
  const groupByDay = (year: number, month: number) => {
    const start = startOfMonth(new Date(year, month, 1));
    const end = endOfMonth(start);
    const map: Record<string, { expense: number; income: number }> = {};

    transactions.forEach((tx) => {
      const d = tx.date?.split('T')[0];
      if (!d) return;
      const parsed = parseISO(d);
      if (parsed >= start && parsed <= end) {
        if (!map[d]) map[d] = { expense: 0, income: 0 };
        if (tx.type === 'expense') map[d].expense += tx.expense || 0;
        else map[d].income += tx.income || 0;
      }
    });
    return map;
  };

  // Group transactions by Nepali day
  const groupByNepaliDay = (nYear: number, nMonth: number) => {
    const map: Record<number, { expense: number; income: number; englishDate: string }> = {};

    transactions.forEach((tx) => {
      const d = tx.date?.split('T')[0];
      if (!d) return;
      const parsed = parseISO(d);
      const nepali = convertEnglishToNepali(parsed);
      if (nepali.year === nYear && nepali.month === nMonth) {
        if (!map[nepali.day]) map[nepali.day] = { expense: 0, income: 0, englishDate: d };
        if (tx.type === 'expense') map[nepali.day].expense += tx.expense || 0;
        else map[nepali.day].income += tx.income || 0;
      }
    });
    return map;
  };

  const currentGrouped = useMemo(() => groupByDay(selectedYear, selectedMonth), [transactions, selectedYear, selectedMonth]);
  const prevGrouped = useMemo(() => groupByDay(prevDate.getFullYear(), prevDate.getMonth()), [transactions, prevDate]);
  const nepaliGrouped = useMemo(() => groupByNepaliDay(nepaliYear, nepaliMonth), [transactions, nepaliYear, nepaliMonth]);
  const prevNepaliGrouped = useMemo(() => {
    const pm = nepaliMonth === 1 ? 12 : nepaliMonth - 1;
    const py = nepaliMonth === 1 ? nepaliYear - 1 : nepaliYear;
    return groupByNepaliDay(py, pm);
  }, [transactions, nepaliYear, nepaliMonth]);

  // Build daily array
  const daysInMonth = calendarMode === 'english'
    ? getDaysInMonth(currentDate)
    : getNepaliDaysInMonth(nepaliYear, nepaliMonth);

  const dailyData = useMemo(() => {
    if (calendarMode === 'english') {
      const arr = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = currentGrouped[dateStr] || { expense: 0, income: 0 };
        const dateObj = new Date(selectedYear, selectedMonth, day);
        const nepali = convertEnglishToNepali(dateObj);
        arr.push({
          date: dateStr,
          day,
          dayName: DAY_NAMES[dateObj.getDay()],
          nepaliDate: formatNepaliDate(nepali.year, nepali.month, nepali.day),
          expense: entry.expense,
          income: entry.income,
          net: entry.income - entry.expense,
        });
      }
      return arr;
    } else {
      const arr = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const entry = nepaliGrouped[day] || { expense: 0, income: 0, englishDate: '' };
        let dayName = '';
        try {
          const engDate = convertNepaliToEnglish(nepaliYear, nepaliMonth, day);
          dayName = DAY_NAMES[engDate.getDay()];
        } catch { dayName = ''; }
        arr.push({
          date: entry.englishDate || `${nepaliYear}-${String(nepaliMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          day,
          dayName,
          nepaliDate: formatNepaliDate(nepaliYear, nepaliMonth, day),
          expense: entry.expense,
          income: entry.income,
          net: entry.income - entry.expense,
        });
      }
      return arr;
    }
  }, [calendarMode, currentGrouped, nepaliGrouped, daysInMonth, selectedYear, selectedMonth, nepaliYear, nepaliMonth]);

  // Filter only days that have data for KPIs
  const daysWithData = dailyData.filter(d => d.expense > 0 || d.income > 0);

  const totalExpense = dailyData.reduce((s, d) => s + d.expense, 0);
  const totalIncome = dailyData.reduce((s, d) => s + d.income, 0);
  const avgDailySpend = daysWithData.length > 0 ? totalExpense / daysWithData.length : 0;

  const highestDay = daysWithData.length > 0
    ? daysWithData.reduce((max, d) => d.expense > max.expense ? d : max, daysWithData[0])
    : null;
  const lowestDay = daysWithData.filter(d => d.expense > 0).length > 0
    ? daysWithData.filter(d => d.expense > 0).reduce((min, d) => d.expense < min.expense ? d : min, daysWithData.filter(d => d.expense > 0)[0])
    : null;

  // Previous month totals for comparison
  const prevTotalExpense = calendarMode === 'english'
    ? Object.values(prevGrouped).reduce((s, d) => s + d.expense, 0)
    : Object.values(prevNepaliGrouped).reduce((s, d) => s + d.expense, 0);
  const pctChange = prevTotalExpense > 0 ? ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100 : 0;

  const prevDaysWithData = calendarMode === 'english'
    ? Object.values(prevGrouped).filter(d => d.expense > 0 || d.income > 0)
    : Object.values(prevNepaliGrouped).filter(d => d.expense > 0 || d.income > 0);
  const prevAvg = prevDaysWithData.length > 0 ? prevTotalExpense / prevDaysWithData.length : 0;
  const avgPctChange = prevAvg > 0 ? ((avgDailySpend - prevAvg) / prevAvg) * 100 : 0;

  // Weekday analysis
  const weekdayData = useMemo(() => {
    const sums: Record<number, { total: number; count: number }> = {};
    for (let i = 0; i < 7; i++) sums[i] = { total: 0, count: 0 };
    dailyData.forEach(d => {
      const dow = new Date(d.date).getDay();
      if (d.expense > 0) {
        sums[dow].total += d.expense;
        sums[dow].count += 1;
      }
    });
    return WEEKDAY_NAMES.map((name, i) => ({
      name,
      short: WEEKDAY_SHORT[i],
      avg: sums[i].count > 0 ? Math.round(sums[i].total / sums[i].count) : 0,
    })).filter(d => d.avg > 0);
  }, [dailyData]);

  const maxWeekdayAvg = Math.max(...weekdayData.map(d => d.avg), 1);

  // Comparison data
  const comparisonData = useMemo(() => {
    if (calendarMode === 'english') {
      const maxDay = Math.min(daysInMonth, getDaysInMonth(prevDate));
      const arr = [];
      for (let day = 1; day <= maxDay; day++) {
        const curKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const cur = currentGrouped[curKey]?.expense || 0;
        const prev = prevGrouped[prevKey]?.expense || 0;
        arr.push({ day: `Day ${String(day).padStart(2, '0')}`, thisMonth: cur, prevMonth: prev, diff: cur - prev });
      }
      return arr;
    } else {
      const prevM = nepaliMonth === 1 ? 12 : nepaliMonth - 1;
      const prevY = nepaliMonth === 1 ? nepaliYear - 1 : nepaliYear;
      const maxDay = Math.min(daysInMonth, getNepaliDaysInMonth(prevY, prevM));
      const arr = [];
      for (let day = 1; day <= maxDay; day++) {
        const cur = nepaliGrouped[day]?.expense || 0;
        const prev = prevNepaliGrouped[day]?.expense || 0;
        arr.push({ day: `Day ${String(day).padStart(2, '0')}`, thisMonth: cur, prevMonth: prev, diff: cur - prev });
      }
      return arr;
    }
  }, [calendarMode, currentGrouped, prevGrouped, nepaliGrouped, prevNepaliGrouped, selectedYear, selectedMonth, daysInMonth]);

  // Chart data - spend trend
  const spendTrendData = useMemo(() => {
    if (calendarMode === 'english') {
      return dailyData.map(d => {
        const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
        return {
          name: `${String(d.day).padStart(2, '0')}`,
          current: d.expense,
          previous: prevGrouped[prevKey]?.expense || 0,
        };
      });
    } else {
      return dailyData.map(d => ({
        name: `${String(d.day).padStart(2, '0')}`,
        current: d.expense,
        previous: prevNepaliGrouped[d.day]?.expense || 0,
      }));
    }
  }, [calendarMode, dailyData, prevGrouped, prevNepaliGrouped]);

  // Chart data - income vs expense
  const incomeVsExpenseData = useMemo(() => {
    return dailyData.filter(d => d.expense > 0 || d.income > 0).map(d => ({
      name: String(d.day).padStart(2, '0'),
      income: d.income,
      expense: d.expense,
    }));
  }, [dailyData]);

  // Month label
  const monthLabel = calendarMode === 'english'
    ? format(currentDate, 'MMMM yyyy')
    : `${NEPALI_MONTHS[nepaliMonth - 1]} ${nepaliYear} BS`;

  const prevMonthLabel = calendarMode === 'english'
    ? format(prevDate, 'MMMM yyyy')
    : `${NEPALI_MONTHS[(nepaliMonth === 1 ? 12 : nepaliMonth - 1) - 1]} ${nepaliMonth === 1 ? nepaliYear - 1 : nepaliYear} BS`;

  // Month/year options
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2026, i, 1), 'MMMM'),
  }));
  const years = [2024, 2025, 2026, 2027];
  const nepaliYears = [2080, 2081, 2082, 2083];

  const handleExport = () => {
    const headers = ['Date', 'Nepali Date', 'Day', 'Expense', 'Income', 'Net'];
    const rows = dailyData.map(d => [d.date, d.nepaliDate, d.dayName, d.expense, d.income, d.net]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-transactions-${calendarMode === 'english' ? format(currentDate, 'yyyy-MM') : `${nepaliYear}-${String(nepaliMonth).padStart(2, '0')}`}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm">Monitoring your fiscal velocity for {monthLabel}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Calendar Mode Toggle */}
          <Tabs value={calendarMode} onValueChange={(v) => setCalendarMode(v as 'english' | 'nepali')}>
            <TabsList className="h-9">
              <TabsTrigger value="english" className="text-xs px-3">English (AD)</TabsTrigger>
              <TabsTrigger value="nepali" className="text-xs px-3">नेपाली (BS)</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Month/Year Selector */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {calendarMode === 'english' ? (
              <>
                <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 w-auto min-w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 w-auto min-w-[60px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Select value={String(nepaliMonth)} onValueChange={v => setNepaliMonth(Number(v))}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 w-auto min-w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEPALI_MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={String(nepaliYear)} onValueChange={v => setNepaliYear(Number(v))}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 w-auto min-w-[60px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nepaliYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">COMPARE</span>
            <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} />
          </div>
          <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Spent</p>
            <p className="text-2xl font-bold text-foreground mt-1">{currency.symbol} {totalExpense.toLocaleString()}<span className="text-base text-muted-foreground">.00</span></p>
            {prevTotalExpense > 0 && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${pctChange >= 0 ? 'text-destructive' : 'text-green-600'}`}>
                {pctChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(0)}% vs last month
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg Daily Spend</p>
            <p className="text-2xl font-bold text-foreground mt-1">{currency.symbol} {Math.round(avgDailySpend).toLocaleString()}<span className="text-base text-muted-foreground">.{String(Math.round(avgDailySpend * 100) % 100).padStart(2, '0').slice(0, 2)}</span></p>
            {prevAvg > 0 && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${avgPctChange <= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {avgPctChange <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {avgPctChange >= 0 ? '+' : ''}{avgPctChange.toFixed(0)}% efficiency
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Highest Day</p>
            {highestDay ? (
              <>
                <p className="text-2xl font-bold text-foreground mt-1">{currency.symbol} {highestDay.expense.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{calendarMode === 'nepali' ? highestDay.nepaliDate : format(parseISO(highestDay.date), 'MMM dd')}</p>
              </>
            ) : <p className="text-muted-foreground text-sm mt-1">No data</p>}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Lowest Day</p>
            {lowestDay ? (
              <>
                <p className="text-2xl font-bold text-foreground mt-1">{currency.symbol} {lowestDay.expense.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{calendarMode === 'nepali' ? lowestDay.nepaliDate : format(parseISO(lowestDay.date), 'MMM dd')}</p>
              </>
            ) : <p className="text-muted-foreground text-sm mt-1">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Main content: Ledger + Weekday/Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column - Tables */}
        <div className="lg:col-span-3 space-y-6">
          {/* Daily Transaction Ledger */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Daily Transaction Ledger</CardTitle>
              <Button variant="link" className="text-primary text-xs font-semibold uppercase tracking-wider p-0 h-auto"
                onClick={() => navigate('/finance/transactions')}>
                View All {daysInMonth} Days
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-xs text-muted-foreground uppercase font-semibold">Date</th>
                      <th className="text-left py-2 text-xs text-muted-foreground uppercase font-semibold">
                        {calendarMode === 'english' ? 'BS Date' : 'AD Date'}
                      </th>
                      <th className="text-left py-2 text-xs text-muted-foreground uppercase font-semibold">Day</th>
                      <th className="text-right py-2 text-xs text-muted-foreground uppercase font-semibold">Expense</th>
                      <th className="text-right py-2 text-xs text-muted-foreground uppercase font-semibold">Income</th>
                      <th className="text-right py-2 text-xs text-muted-foreground uppercase font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map(d => (
                      <tr key={d.day} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => d.date && navigate(`/finance/transactions?date=${d.date}`)}>
                        <td className="py-3">
                          {calendarMode === 'english' ? (
                            <>
                              <div className="text-foreground font-medium">{d.date ? format(parseISO(d.date), 'MMM dd') : `Day ${d.day}`}</div>
                            </>
                          ) : (
                            <div className="text-foreground font-medium">{d.nepaliDate}</div>
                          )}
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">
                          {calendarMode === 'english' ? d.nepaliDate : (d.date && d.date.includes('-') ? d.date : '—')}
                        </td>
                        <td className="py-3 text-foreground">{d.dayName}</td>
                        <td className="py-3 text-right font-medium text-destructive">
                          {currency.symbol} {d.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right font-medium text-foreground">
                          {currency.symbol} {d.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3 text-right font-medium ${d.net >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {d.net >= 0 ? '+' : '-'} {currency.symbol} {Math.abs(d.net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Period Comparison */}
          {compareEnabled && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Period Comparison Analysis</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Comparison based on calendar day ({comparisonData.slice(0, 3).map(d => d.day.replace('Day ', '')).join(', ')})
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-xs text-muted-foreground uppercase font-semibold">Timeline</th>
                        <th className="text-right py-2 text-xs text-muted-foreground uppercase font-semibold">This Month</th>
                        <th className="text-right py-2 text-xs text-muted-foreground uppercase font-semibold">Prev Month</th>
                        <th className="text-right py-2 text-xs text-muted-foreground uppercase font-semibold">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map(d => (
                        <tr key={d.day} className="border-b border-border/50">
                          <td className="py-3 text-foreground font-medium">{d.day}</td>
                          <td className="py-3 text-right text-foreground">{currency.symbol} {d.thisMonth.toLocaleString()}</td>
                          <td className="py-3 text-right text-muted-foreground">{currency.symbol} {d.prevMonth.toLocaleString()}</td>
                          <td className={`py-3 text-right font-medium ${d.diff > 0 ? 'text-destructive' : d.diff < 0 ? 'text-green-600' : 'text-foreground'}`}>
                            {d.diff > 0 ? '+' : ''}{currency.symbol} {d.diff.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {comparisonData.length === 0 && (
                        <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No comparison data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Weekday + Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Velocity by Weekday */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Velocity by Weekday</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weekdayData.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {d.short}
                    </div>
                    <span className="text-sm text-foreground flex-1">{d.name}</span>
                    <span className="text-sm font-semibold text-foreground">{currency.symbol} {d.avg.toLocaleString()}</span>
                  </div>
                ))}
                {weekdayData.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
              </div>
              {weekdayData.length > 0 && (
                <div className="mt-3 space-y-2">
                  {weekdayData.map(d => (
                    <div key={d.name + '-bar'} className="flex items-center gap-2">
                      <div className="w-8 text-xs text-muted-foreground text-center">{d.short}</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(d.avg / maxWeekdayAvg) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Spend Trend Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Spend Trend ({format(currentDate, 'MMMM')})</CardTitle>
            </CardHeader>
            <CardContent>
              {spendTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={spendTrendData}>
                    <XAxis dataKey="name" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="current" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="This Month" />
                    {compareEnabled && (
                      <Line type="monotone" dataKey="previous" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Prev Month" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">No data</p>}
            </CardContent>
          </Card>

          {/* Income vs Expense Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Income vs Expense</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeVsExpenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={incomeVsExpenseData}>
                    <XAxis dataKey="name" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">No data</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DailyTransactions;
