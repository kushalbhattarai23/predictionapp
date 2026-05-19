import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, X, TrendingDown, TrendingUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { convertEnglishToNepali, convertNepaliToEnglish, formatNepaliDate } from '@/utils/dateConverter';

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const NEPALI_MONTHS = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'असोज',
  'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'
];

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

interface MonthData {
  month: number;
  monthName: string;
  nepaliName: string;
  expense: number;
  income: number;
  categories: Record<string, number>;
}

const MonthlyHeatmap: React.FC = () => {
  const { transactions } = useTransactions();
  const { currency } = useCurrency();
  const now = new Date();
  const currentNepali = convertEnglishToNepali(now);

  const [calendarMode, setCalendarMode] = useState<'english' | 'nepali'>('english');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [nepaliYear, setNepaliYear] = useState(currentNepali.year);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);

  const monthlyData = useMemo(() => {
    const months: MonthData[] = [];

    for (let m = 0; m < 12; m++) {
      const catMap: Record<string, number> = {};
      let expense = 0, income = 0;

      if (calendarMode === 'english') {
        const prefix = `${selectedYear}-${String(m + 1).padStart(2, '0')}`;
        transactions.forEach((tx) => {
          const d = tx.date?.split('T')[0];
          if (d && d.startsWith(prefix)) {
            if (tx.type === 'expense') {
              expense += tx.expense || 0;
              const catName = tx.categories?.name || 'Uncategorized';
              catMap[catName] = (catMap[catName] || 0) + (tx.expense || 0);
            } else {
              income += tx.income || 0;
            }
          }
        });
      } else {
        // For Nepali months, convert each day range to English and match
        try {
          const startEng = convertNepaliToEnglish(nepaliYear, m + 1, 1);
          const endEng = convertNepaliToEnglish(nepaliYear, m + 1, 30); // approximate
          const startStr = format(startEng, 'yyyy-MM-dd');
          const endStr = format(endEng, 'yyyy-MM-dd');

          transactions.forEach((tx) => {
            const d = tx.date?.split('T')[0];
            if (d && d >= startStr && d <= endStr) {
              if (tx.type === 'expense') {
                expense += tx.expense || 0;
                const catName = tx.categories?.name || 'Uncategorized';
                catMap[catName] = (catMap[catName] || 0) + (tx.expense || 0);
              } else {
                income += tx.income || 0;
              }
            }
          });
        } catch {
          // skip on conversion error
        }
      }

      months.push({
        month: m + 1,
        monthName: ENGLISH_MONTHS[m],
        nepaliName: NEPALI_MONTHS[m],
        expense,
        income,
        categories: catMap,
      });
    }
    return months;
  }, [transactions, calendarMode, selectedYear, nepaliYear]);

  const maxExpense = Math.max(...monthlyData.map(d => d.expense), 1);

  const net = selectedMonth ? selectedMonth.income - selectedMonth.expense : 0;
  const sortedCategories = useMemo(() => {
    if (!selectedMonth) return [];
    return Object.entries(selectedMonth.categories).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [selectedMonth]);

  const yearLabel = calendarMode === 'english' ? selectedYear : nepaliYear;

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Monthly<br />Heatmap
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              12 months of spending patterns at a glance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2 shadow-sm">
              <button onClick={() => { calendarMode === 'english' ? setSelectedYear(y => y - 1) : setNepaliYear(y => y - 1); setSelectedMonth(null); }} className="p-1 hover:bg-accent rounded-md transition-colors">
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              <Select
                value={String(yearLabel)}
                onValueChange={(v) => { calendarMode === 'english' ? setSelectedYear(parseInt(v)) : setNepaliYear(parseInt(v)); setSelectedMonth(null); }}
              >
                <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-foreground min-w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => (calendarMode === 'english' ? now.getFullYear() : currentNepali.year) - 5 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button onClick={() => { calendarMode === 'english' ? setSelectedYear(y => y + 1) : setNepaliYear(y => y + 1); setSelectedMonth(null); }} className="p-1 hover:bg-accent rounded-md transition-colors">
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nepali</span>
              <Switch checked={calendarMode === 'nepali'} onCheckedChange={(v) => setCalendarMode(v ? 'nepali' : 'english')} />
            </div>
          </div>

          {/* Month Grid: 3 rows x 4 columns */}
          <div className="bg-card rounded-2xl p-4 md:p-6">
            <div className="grid grid-cols-4 gap-3">
              {monthlyData.map((cell) => {
                const level = getHeatLevel(cell.expense, maxExpense);
                const isSelected = selectedMonth?.month === cell.month;
                const isCurrent = calendarMode === 'english'
                  ? (cell.month === now.getMonth() + 1 && selectedYear === now.getFullYear())
                  : (cell.month === currentNepali.month && nepaliYear === currentNepali.year);

                return (
                  <button
                    key={cell.month}
                    onClick={() => setSelectedMonth(cell)}
                    className={`
                      rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px]
                      transition-all duration-200 hover:scale-105 cursor-pointer
                      ${isSelected ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}
                      ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                    `}
                    style={{ backgroundColor: HEATMAP_COLORS[level] }}
                  >
                    <span className={`text-sm font-bold ${level >= 3 ? 'text-white' : 'text-foreground'}`}>
                      {calendarMode === 'nepali' ? cell.nepaliName : cell.monthName.slice(0, 3)}
                    </span>
                    <span className={`text-xs mt-1 ${level >= 3 ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {cell.expense > 0 ? `${currency.symbol}${cell.expense.toLocaleString()}` : '—'}
                    </span>
                  </button>
                );
              })}
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
          {selectedMonth ? (
            <div className="bg-card rounded-2xl p-6 space-y-5 sticky top-4">
              <div className="flex items-start justify-between">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  {calendarMode === 'nepali' ? selectedMonth.nepaliName : selectedMonth.monthName}
                </span>
                <button onClick={() => setSelectedMonth(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {calendarMode === 'nepali' ? `${selectedMonth.nepaliName} ${nepaliYear}` : `${selectedMonth.monthName} ${selectedYear}`}
                </h2>
                <p className="text-sm text-muted-foreground">Monthly Spending Overview</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Spend</p>
                  <p className="text-xl font-bold text-destructive mt-1">{currency.symbol}{selectedMonth.expense.toLocaleString()}</p>
                </div>
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Income</p>
                  <p className="text-xl font-bold text-primary mt-1">{currency.symbol}{selectedMonth.income.toLocaleString()}</p>
                </div>
              </div>

              <div className={`flex items-center justify-between rounded-xl p-4 ${net >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <div className="flex items-center gap-3">
                  {net >= 0 ? <TrendingUp className="h-5 w-5 text-primary" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
                  <span className="font-semibold text-foreground">{net >= 0 ? 'Monthly Net Surplus' : 'Monthly Net Deficit'}</span>
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
              <p className="text-sm font-medium text-foreground">Select a month</p>
              <p className="text-xs text-muted-foreground">Click on any month to see detailed spending insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyHeatmap;
