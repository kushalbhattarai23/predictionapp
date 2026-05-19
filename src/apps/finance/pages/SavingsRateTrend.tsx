import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategories } from '@/hooks/useCategories';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, TooltipProps, BarChart, Bar, Legend
} from 'recharts';
import { convertEnglishToNepali, convertNepaliToEnglish, formatNepaliDate } from '@/utils/dateConverter';

const NEPALI_MONTHS = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'असोज',
  'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type Granularity = 'monthly' | 'weekly';

interface SavingsDataPoint {
  label: string;
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
}

const getWeekKey = (d: Date): string => {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

const parseNepaliDate = (dateString?: string | null) => {
  if (!dateString) return null;
  const parts = dateString.split(/[/-]/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
};

const getNepaliWeekOfYear = (year: number, month: number, day: number): number => {
  // Approximate week of year for Nepali calendar (1-based)
  // Treat each Nepali month as ~30 days
  const dayOfYear = (month - 1) * 30 + day;
  return Math.min(52, Math.max(1, Math.ceil(dayOfYear / 7)));
};

const SavingsRateTrend: React.FC = () => {
  const { transactions } = useTransactions();
  const { currency, formatAmount: fmtAmt } = useCurrency();
  const currencySymbol = currency.symbol;

  const [isNepali, setIsNepali] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>('monthly');

  // Year/month navigation
  const now = new Date();
  const currentEngYear = now.getFullYear();
  const currentEngMonth = now.getMonth() + 1;
  const currentNepali = (() => {
    try { return convertEnglishToNepali(new Date(currentEngYear, currentEngMonth - 1, 1)); } catch { return { year: 2082, month: 1, day: 1 }; }
  })();

  const [selectedYear, setSelectedYear] = useState(isNepali ? currentNepali.year : currentEngYear);

  const toggleCalendar = () => {
    if (isNepali) {
      try {
      const eng = convertNepaliToEnglish(selectedYear, 1, 1);
        setSelectedYear(eng.getFullYear());
      } catch { setSelectedYear(currentEngYear); }
    } else {
      try {
        const nep = convertEnglishToNepali(new Date(selectedYear, 0, 1));
        setSelectedYear(nep.year);
      } catch { setSelectedYear(currentNepali.year); }
    }
    setIsNepali(!isNepali);
  };

  const yearOptions = isNepali
    ? Array.from({ length: 10 }, (_, i) => currentNepali.year - 5 + i)
    : Array.from({ length: 10 }, (_, i) => currentEngYear - 5 + i);

  // Build data
  const data = useMemo<SavingsDataPoint[]>(() => {
    if (granularity === 'monthly') {
      const months = isNepali ? 12 : 12;
      const points: SavingsDataPoint[] = [];

      for (let m = 1; m <= months; m++) {
        let monthTransactions;
        if (isNepali) {
          monthTransactions = transactions.filter(t => {
            const p = parseNepaliDate(t.nepali_date);
            return p && p.year === selectedYear && p.month === m;
          });
        } else {
          const engPrefix = `${selectedYear}-${String(m).padStart(2, '0')}`;
          monthTransactions = transactions.filter(t => t.date.startsWith(engPrefix));
        }

        const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.income ?? 0), 0);
        const expense = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.expense ?? 0), 0);
        const savings = income - expense;
        const savingsRate = income === 0 ? 0 : Math.round((savings / income) * 10000) / 100;

        points.push({
          label: isNepali ? NEPALI_MONTHS[m - 1] : ENGLISH_MONTHS[m - 1].slice(0, 3),
          income,
          expense,
          savings,
          savingsRate,
        });
      }
      return points;
    } else {
      // Weekly
      const weekMap = new Map<string, { income: number; expense: number }>();
      if (isNepali) {
        const yearTransactions = transactions.filter(t => {
          const p = parseNepaliDate(t.nepali_date);
          return p && p.year === selectedYear;
        });
        for (const t of yearTransactions) {
          const p = parseNepaliDate(t.nepali_date)!;
          const wk = `W${String(getNepaliWeekOfYear(p.year, p.month, p.day)).padStart(2, '0')}`;
          const b = weekMap.get(wk) ?? { income: 0, expense: 0 };
          if (t.type === 'income') b.income += t.income ?? 0;
          else b.expense += t.expense ?? 0;
          weekMap.set(wk, b);
        }
      } else {
        const yearTransactions = transactions.filter(t => t.date.startsWith(`${selectedYear}`));
        for (const t of yearTransactions) {
          const d = new Date(t.date + 'T00:00:00');
          const wk = getWeekKey(d).split('-')[1];
          const b = weekMap.get(wk) ?? { income: 0, expense: 0 };
          if (t.type === 'income') b.income += t.income ?? 0;
          else b.expense += t.expense ?? 0;
          weekMap.set(wk, b);
        }
      }
      return Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, { income, expense }]) => {
          const savings = income - expense;
          const savingsRate = income === 0 ? 0 : Math.round((savings / income) * 10000) / 100;
          return { label: key, income, expense, savings, savingsRate };
        });
    }
  }, [transactions, selectedYear, isNepali, granularity]);

  // Summary stats
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);
  const totalSavings = totalIncome - totalExpense;
  const overallRate = totalIncome === 0 ? 0 : Math.round((totalSavings / totalIncome) * 10000) / 100;
  const bestMonth = data.reduce((best, d) => d.savingsRate > best.savingsRate ? d : best, data[0]);
  const worstMonth = data.reduce((worst, d) => d.savingsRate < worst.savingsRate ? d : worst, data[0]);

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as SavingsDataPoint | undefined;
    if (!d) return null;
    return (
      <div className="rounded-lg border bg-background p-3 text-xs shadow-xl space-y-1">
        <p className="font-semibold">{label}</p>
        <p className="text-green-600">Income: {currencySymbol}{d.income.toLocaleString()}</p>
        <p className="text-red-500">Expense: {currencySymbol}{d.expense.toLocaleString()}</p>
        <p>Savings: {currencySymbol}{d.savings.toLocaleString()}</p>
        <p className={d.savingsRate >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
          Rate: {d.savingsRate.toFixed(2)}%
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-700">Savings Rate Trend</h1>
          <p className="text-muted-foreground text-sm">Track how much of your income you save over time</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm">EN</span>
            <Switch checked={isNepali} onCheckedChange={toggleCalendar} />
            <span className="text-sm">NP</span>
          </div>
          <Tabs value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
            <TabsList className="h-8">
              <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-3">Weekly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Year nav */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(y => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(y => y + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Overall Rate</p>
            <p className={`text-2xl font-bold ${overallRate >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {overallRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Total Savings</p>
            <p className={`text-2xl font-bold ${totalSavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {currencySymbol}{Math.abs(totalSavings).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        {bestMonth && (
          <Card className="border-green-200">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Best</p>
              <p className="text-lg font-bold text-green-600">{bestMonth.label}</p>
              <p className="text-xs text-muted-foreground">{bestMonth.savingsRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        )}
        {worstMonth && (
          <Card className="border-green-200">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Worst</p>
              <p className="text-lg font-bold text-red-500">{worstMonth.label}</p>
              <p className="text-xs text-muted-foreground">{worstMonth.savingsRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Line chart */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700 text-base">Savings Rate (%)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No data for {selectedYear}</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: '0% Break-even', position: 'insideTopRight', fontSize: 10 }} />
                <ReferenceLine y={20} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: '20% Healthy', position: 'insideTopRight', fontSize: 10 }} />
                <Line type="monotone" dataKey="savingsRate" stroke="#22C55E" strokeWidth={2} dot={{ r: 4, fill: '#22C55E' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Income vs Expense bar chart */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700 text-base">Income vs Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No data for {selectedYear}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number, name: string) => [`${currencySymbol}${value.toLocaleString()}`, name]} />
                <Legend />
                <Bar dataKey="income" fill="#22C55E" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Data table */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700 text-base">Detailed Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Period</th>
                  <th className="text-right py-2 px-3">Income</th>
                  <th className="text-right py-2 px-3">Expense</th>
                  <th className="text-right py-2 px-3">Savings</th>
                  <th className="text-right py-2 px-3">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">{d.label}</td>
                    <td className="py-2 px-3 text-right text-green-600">{currencySymbol}{d.income.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-red-500">{currencySymbol}{d.expense.toLocaleString()}</td>
                    <td className={`py-2 px-3 text-right font-medium ${d.savings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {currencySymbol}{d.savings.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Badge variant={d.savingsRate >= 20 ? 'default' : d.savingsRate >= 0 ? 'secondary' : 'destructive'} className="text-xs">
                        {d.savingsRate.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsRateTrend;
