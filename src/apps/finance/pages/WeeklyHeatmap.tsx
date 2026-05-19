import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, X, TrendingDown, TrendingUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { convertEnglishToNepali, convertNepaliToEnglish, formatNepaliDate } from '@/utils/dateConverter';

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

interface WeekData {
  week: number;
  expense: number;
  income: number;
  startDate: string;
  endDate: string;
  nepaliStart: string;
  nepaliEnd: string;
  categories: Record<string, number>;
}

const WeeklyHeatmap: React.FC = () => {
  const { transactions } = useTransactions();
  const { currency } = useCurrency();
  const now = new Date();
  const currentNepali = convertEnglishToNepali(now);

  const [calendarMode, setCalendarMode] = useState<'english' | 'nepali'>('english');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [nepaliYear, setNepaliYear] = useState(currentNepali.year);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);

  const weeklyData = useMemo(() => {
    const isNepaliMode = calendarMode === 'nepali';
    const rangeStart = isNepaliMode
      ? convertNepaliToEnglish(nepaliYear, 1, 1)
      : new Date(selectedYear, 0, 1);
    const rangeEnd = isNepaliMode
      ? new Date(convertNepaliToEnglish(nepaliYear + 1, 1, 1).getTime() - 86400000)
      : new Date(selectedYear, 11, 31);

    const weeks: WeekData[] = [];
    let weekNumber = 1;
    let cursor = startOfWeek(rangeStart, { weekStartsOn: 0 });

    while (cursor <= rangeEnd) {
      const ws = cursor < rangeStart ? rangeStart : cursor;
      const rawWeekEnd = endOfWeek(cursor, { weekStartsOn: 0 });
      const we = rawWeekEnd > rangeEnd ? rangeEnd : rawWeekEnd;
      const wsStr = format(ws, 'yyyy-MM-dd');
      const weStr = format(we, 'yyyy-MM-dd');
      const nepS = convertEnglishToNepali(ws);
      const nepE = convertEnglishToNepali(we);

      const catMap: Record<string, number> = {};
      let expense = 0, income = 0;

      transactions.forEach((tx) => {
        const d = tx.date?.split('T')[0];
        if (d && d >= wsStr && d <= weStr) {
          if (tx.type === 'expense') {
            expense += tx.expense || 0;
            const catName = tx.categories?.name || 'Uncategorized';
            catMap[catName] = (catMap[catName] || 0) + (tx.expense || 0);
          } else {
            income += tx.income || 0;
          }
        }
      });

      weeks.push({
        week: weekNumber,
        expense,
        income,
        startDate: wsStr,
        endDate: weStr,
        nepaliStart: formatNepaliDate(nepS.year, nepS.month, nepS.day),
        nepaliEnd: formatNepaliDate(nepE.year, nepE.month, nepE.day),
        categories: catMap,
      });

      cursor = new Date(cursor.getTime() + 7 * 86400000);
      weekNumber += 1;
    }
    return weeks;
  }, [transactions, selectedYear, nepaliYear, calendarMode]);

  const maxExpense = Math.max(...weeklyData.map(d => d.expense), 1);

  // Calendar-like layout: 7 columns (Week 1-7, 8-14, ...)
  const weekRows = useMemo(() => {
    const rows: WeekData[][] = [];
    for (let i = 0; i < weeklyData.length; i += 7) {
      rows.push(weeklyData.slice(i, i + 7));
    }
    return rows;
  }, [weeklyData]);

  const net = selectedWeek ? selectedWeek.income - selectedWeek.expense : 0;
  const sortedCategories = useMemo(() => {
    if (!selectedWeek) return [];
    return Object.entries(selectedWeek.categories).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [selectedWeek]);

  const currentWeekInView = useMemo(() => {
    const today = format(now, 'yyyy-MM-dd');
    return weeklyData.find((week) => today >= week.startDate && today <= week.endDate)?.week;
  }, [now, weeklyData]);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Weekly<br />Heatmap
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              52 weeks of spending visualized at a glance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2 shadow-sm">
              <button
                onClick={() => {
                  if (calendarMode === 'nepali') {
                    setNepaliYear((y) => y - 1);
                  } else {
                    setSelectedYear((y) => y - 1);
                  }
                  setSelectedWeek(null);
                }}
                className="p-1 hover:bg-accent rounded-md transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              <Select
                value={String(calendarMode === 'nepali' ? nepaliYear : selectedYear)}
                onValueChange={(v) => {
                  if (calendarMode === 'nepali') {
                    setNepaliYear(parseInt(v));
                  } else {
                    setSelectedYear(parseInt(v));
                  }
                  setSelectedWeek(null);
                }}
              >
                <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-foreground min-w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) =>
                    (calendarMode === 'nepali' ? currentNepali.year : now.getFullYear()) - 5 + i
                  ).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => {
                  if (calendarMode === 'nepali') {
                    setNepaliYear((y) => y + 1);
                  } else {
                    setSelectedYear((y) => y + 1);
                  }
                  setSelectedWeek(null);
                }}
                className="p-1 hover:bg-accent rounded-md transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nepali</span>
              <Switch
                checked={calendarMode === 'nepali'}
                onCheckedChange={(v) => {
                  setCalendarMode(v ? 'nepali' : 'english');
                  setSelectedWeek(null);
                }}
              />
            </div>
          </div>

          {/* Week Grid */}
          <div className="bg-card rounded-2xl p-4 md:p-6">
            <div className="space-y-2">
              {weekRows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-7 gap-2">
                  {row.map((cell, ci) => {
                    const level = getHeatLevel(cell.expense, maxExpense);
                    const isSelected = selectedWeek?.week === cell.week;
                    const isCurrent = cell.week === currentWeekInView;

                    return (
                      <button
                        key={ci}
                        onClick={() => setSelectedWeek(cell)}
                        className={`
                          aspect-square rounded-sm relative flex items-center justify-center
                          transition-all duration-200 hover:scale-105 cursor-pointer
                          ${isSelected ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background' : ''}
                          ${isCurrent ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                        `}
                        style={{ backgroundColor: HEATMAP_COLORS[level] }}
                        title={`Week ${cell.week}: ${currency.symbol}${cell.expense.toLocaleString()}`}
                      >
                        <span className={`text-xs font-semibold ${level >= 3 ? 'text-white' : 'text-foreground'}`}>
                          {cell.week}
                        </span>
                      </button>
                    );
                  })}
                  {Array.from({ length: 7 - row.length }, (_, fillerIndex) => (
                    <div key={`filler-${fillerIndex}`} className="aspect-square rounded-sm bg-transparent" />
                  ))}
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

        {/* Insight Panel */}
        <div className="w-full lg:w-[380px] shrink-0">
          {selectedWeek ? (
            <div className="bg-card rounded-2xl p-6 space-y-5 sticky top-4">
              <div className="flex items-start justify-between">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Week {selectedWeek.week}
                </span>
                <button onClick={() => setSelectedWeek(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {calendarMode === 'nepali'
                    ? `${selectedWeek.nepaliStart} — ${selectedWeek.nepaliEnd}`
                    : `${selectedWeek.startDate} — ${selectedWeek.endDate}`}
                </h2>
                <p className="text-sm text-muted-foreground">Weekly Spending Overview</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Spend</p>
                  <p className="text-xl font-bold text-destructive mt-1">{currency.symbol}{selectedWeek.expense.toLocaleString()}</p>
                </div>
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Income</p>
                  <p className="text-xl font-bold text-primary mt-1">{currency.symbol}{selectedWeek.income.toLocaleString()}</p>
                </div>
              </div>

              <div className={`flex items-center justify-between rounded-xl p-4 ${net >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <div className="flex items-center gap-3">
                  {net >= 0 ? <TrendingUp className="h-5 w-5 text-primary" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
                  <span className="font-semibold text-foreground">{net >= 0 ? 'Weekly Net Surplus' : 'Weekly Net Deficit'}</span>
                </div>
                <span className={`font-bold text-lg ${net >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {net >= 0 ? '+' : '-'}{currency.symbol}{Math.abs(net).toLocaleString()}
                </span>
              </div>

              {sortedCategories.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full" />
                    Top Expenditure Categories
                  </p>
                  {sortedCategories.map(([name, amount]) => (
                    <div key={name} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-foreground">{name}</span>
                      <span className="text-sm font-semibold text-foreground">{currency.symbol}{amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Select a week</p>
              <p className="text-xs text-muted-foreground">Click on any week to see detailed spending insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyHeatmap;
