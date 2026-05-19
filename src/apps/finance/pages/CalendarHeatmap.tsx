import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategories } from '@/hooks/useCategories';

const formatAmount = (symbol: string, amount: number) => `${symbol}${amount.toLocaleString()}`;
import { format, getDaysInMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, X, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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

// Heatmap color scale from design spec
const HEATMAP_COLORS = [
  'hsl(0 0% 95%)',       // Level 0 - no data
  'hsl(90 54% 73%)',     // Level 1 - #C6E48B
  'hsl(110 44% 61%)',    // Level 2 - #7BC96F
  'hsl(136 63% 41%)',    // Level 3 - #239A3B
  'hsl(140 60% 24%)',    // Level 4 - #196127
];

const getHeatLevel = (expense: number, maxExpense: number): number => {
  if (expense === 0) return 0;
  if (maxExpense === 0) return 0;
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
}

const CalendarHeatmap: React.FC = () => {
  const { transactions } = useTransactions();
  const { currency } = useCurrency();
  const { categories } = useCategories();
  const navigate = useNavigate();

  const now = new Date();
  const currentNepali = convertEnglishToNepali(now);

  const [calendarMode, setCalendarMode] = useState<'english' | 'nepali'>('english');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [nepaliYear, setNepaliYear] = useState(currentNepali.year);
  const [nepaliMonth, setNepaliMonth] = useState(currentNepali.month);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const monthLabel = calendarMode === 'english'
    ? format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy')
    : `${NEPALI_MONTHS[nepaliMonth - 1]} ${nepaliYear}`;

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

  // Build daily data with category breakdown
  const dailyData = useMemo(() => {
    if (calendarMode === 'english') {
      const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth, 1));
      const start = startOfMonth(new Date(selectedYear, selectedMonth, 1));
      const end = endOfMonth(start);
      const days: DayData[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(selectedYear, selectedMonth, day);
        const nepali = convertEnglishToNepali(dateObj);
        const catMap: Record<string, number> = {};
        let expense = 0, income = 0;

        transactions.forEach((tx) => {
          const d = tx.date?.split('T')[0];
          if (d === dateStr) {
            if (tx.type === 'expense') {
              expense += tx.expense || 0;
              const catName = tx.categories?.name || 'Uncategorized';
              catMap[catName] = (catMap[catName] || 0) + (tx.expense || 0);
            } else {
              income += tx.income || 0;
            }
          }
        });

        days.push({
          day,
          date: dateStr,
          expense,
          income,
          dayOfWeek: dateObj.getDay(),
          dayName: DAY_NAMES[dateObj.getDay()],
          nepaliDate: formatNepaliDate(nepali.year, nepali.month, nepali.day),
          categories: catMap,
        });
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
        const catMap: Record<string, number> = {};
        let expense = 0, income = 0;

        transactions.forEach((tx) => {
          const d = tx.date?.split('T')[0];
          if (d === dateStr) {
            if (tx.type === 'expense') {
              expense += tx.expense || 0;
              const catName = tx.categories?.name || 'Uncategorized';
              catMap[catName] = (catMap[catName] || 0) + (tx.expense || 0);
            } else {
              income += tx.income || 0;
            }
          }
        });

        days.push({
          day,
          date: dateStr,
          expense,
          income,
          dayOfWeek,
          dayName: DAY_NAMES[dayOfWeek],
          nepaliDate: formatNepaliDate(nepaliYear, nepaliMonth, day),
          categories: catMap,
        });
      }
      return days;
    }
  }, [transactions, calendarMode, selectedYear, selectedMonth, nepaliYear, nepaliMonth]);

  const maxExpense = Math.max(...dailyData.map(d => d.expense), 1);

  // Build calendar grid (weeks × 7)
  const calendarGrid = useMemo(() => {
    if (dailyData.length === 0) return [];
    const firstDayOfWeek = dailyData[0].dayOfWeek;
    const grid: (DayData | null)[][] = [];
    let week: (DayData | null)[] = Array(firstDayOfWeek).fill(null);

    dailyData.forEach((d) => {
      week.push(d);
      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    });
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      grid.push(week);
    }
    return grid;
  }, [dailyData]);

  // Weekday average for architect tip
  const weekdayAvg = useMemo(() => {
    const sums: Record<number, { total: number; count: number }> = {};
    for (let i = 0; i < 7; i++) sums[i] = { total: 0, count: 0 };
    dailyData.forEach(d => {
      if (d.expense > 0) {
        sums[d.dayOfWeek].total += d.expense;
        sums[d.dayOfWeek].count += 1;
      }
    });
    return sums;
  }, [dailyData]);

  const isToday = (d: DayData) => {
    if (calendarMode === 'english') {
      return d.date === format(now, 'yyyy-MM-dd');
    }
    return false;
  };

  // Sort categories for selected day
  const sortedCategories = useMemo(() => {
    if (!selectedDay) return [];
    return Object.entries(selectedDay.categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [selectedDay]);

  const net = selectedDay ? selectedDay.income - selectedDay.expense : 0;
  const tipDay = selectedDay;
  const tipAvg = tipDay ? (weekdayAvg[tipDay.dayOfWeek].count > 0
    ? weekdayAvg[tipDay.dayOfWeek].total / weekdayAvg[tipDay.dayOfWeek].count : 0) : 0;
  const tipPctAbove = tipDay && tipAvg > 0
    ? Math.round(((tipDay.expense - tipAvg) / tipAvg) * 100) : 0;

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Heatmap */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Calendar<br />Heatmap
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Visualizing your spending narrative through editorial precision.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2 shadow-sm">
              <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-accent rounded-md transition-colors">
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              {calendarMode === 'english' ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(v) => { setSelectedMonth(parseInt(v)); setSelectedDay(null); }}
                  >
                    <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-foreground min-w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {format(new Date(selectedYear, i, 1), 'MMMM')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(v) => { setSelectedYear(parseInt(v)); setSelectedDay(null); }}
                  >
                    <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-foreground min-w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Select
                    value={String(nepaliMonth)}
                    onValueChange={(v) => { setNepaliMonth(parseInt(v)); setSelectedDay(null); }}
                  >
                    <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-foreground min-w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NEPALI_MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(nepaliYear)}
                    onValueChange={(v) => { setNepaliYear(parseInt(v)); setSelectedDay(null); }}
                  >
                    <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-foreground min-w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
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
              <Switch
                checked={calendarMode === 'nepali'}
                onCheckedChange={(v) => setCalendarMode(v ? 'nepali' : 'english')}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Compare</span>
              <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-card rounded-2xl p-4 md:p-6">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAY_HEADERS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid cells */}
            <div className="space-y-1">
              {calendarGrid.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((cell, ci) => {
                    if (!cell) {
                      return <div key={ci} className="aspect-square rounded-sm" />;
                    }
                    const level = getHeatLevel(cell.expense, maxExpense);
                    const isSelected = selectedDay?.day === cell.day;
                    const isTodayCell = isToday(cell);

                    return (
                      <button
                        key={ci}
                        onClick={() => setSelectedDay(cell)}
                        className={`
                          aspect-square rounded-sm relative flex items-start justify-end p-1.5
                          transition-all duration-200 hover:scale-105 cursor-pointer
                          ${isSelected ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background' : ''}
                          ${isTodayCell ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                        `}
                        style={{ backgroundColor: HEATMAP_COLORS[level] }}
                      >
                        <span className={`text-xs font-medium ${level >= 3 ? 'text-white' : 'text-foreground'}`}>
                          {cell.day}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
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
                  Active Insight
                </span>
                <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {calendarMode === 'english'
                    ? format(parseISO(selectedDay.date), 'MMM d, yyyy')
                    : selectedDay.nepaliDate}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedDay.dayName}'s Transaction Narrative
                </p>
              </div>

              {/* Spend / Income boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Spend</p>
                  <p className="text-xl font-bold text-destructive mt-1">
                    {currency.symbol}{selectedDay.expense.toLocaleString()}
                  </p>
                </div>
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Income</p>
                  <p className="text-xl font-bold text-primary mt-1">
                    {currency.symbol}{selectedDay.income.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Net */}
              <div className={`flex items-center justify-between rounded-xl p-4 ${net >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <div className="flex items-center gap-3">
                  {net >= 0
                    ? <TrendingUp className="h-5 w-5 text-primary" />
                    : <TrendingDown className="h-5 w-5 text-destructive" />
                  }
                  <span className="font-semibold text-foreground">
                    {net >= 0 ? 'Daily Net Surplus' : 'Daily Net Deficit'}
                  </span>
                </div>
                <span className={`font-bold text-lg ${net >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {net >= 0 ? '+' : '-'}{currency.symbol}{Math.abs(net).toLocaleString()}
                </span>
              </div>

              {/* Top categories */}
              {sortedCategories.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full" />
                    Top Expenditure Categories
                  </p>
                  {sortedCategories.map(([name, amount]) => (
                    <div key={name} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-foreground">{name}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {currency.symbol}{amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* View All button */}
              <Button
                className="w-full rounded-xl h-12 font-semibold"
                onClick={() => navigate(`/finance/transactions?date=${selectedDay.date}`)}
              >
                View All Transactions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {/* Architect Tip */}
              {tipDay && tipDay.expense > 0 && tipPctAbove !== 0 && (
                <div className="bg-secondary rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    Architect Tip
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your spending on this {tipDay.dayName} is{' '}
                    <span className="font-semibold text-foreground">
                      {Math.abs(tipPctAbove)}% {tipPctAbove > 0 ? 'higher' : 'lower'}
                    </span>{' '}
                    than your average {tipDay.dayName}. {tipPctAbove > 0
                      ? 'Consider consolidating expenses to improve net performance.'
                      : 'Great job maintaining spending discipline.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Select a day</p>
              <p className="text-xs text-muted-foreground">
                Click on any day in the calendar to see detailed spending insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
