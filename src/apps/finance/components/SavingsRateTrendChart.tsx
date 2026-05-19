import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, TooltipProps
} from 'recharts';
import type { Transaction } from '@/hooks/useTransactions';

type Granularity = 'monthly' | 'weekly';

interface SavingsDataPoint {
  date: string;
  income: number;
  expense: number;
  savingsRate: number;
}

const getWeekKey = (d: Date): string => {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

const groupKey = (dateStr: string, granularity: Granularity): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return granularity === 'monthly' ? dateStr.slice(0, 7) : getWeekKey(d);
};

const formatLabel = (key: string, granularity: Granularity): string => {
  if (granularity === 'monthly') {
    const d = new Date(key + '-01');
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return key; // W01, W02 etc.
};

const buildData = (transactions: Transaction[], granularity: Granularity): SavingsDataPoint[] => {
  const buckets = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const k = groupKey(t.date, granularity);
    const b = buckets.get(k) ?? { income: 0, expense: 0 };
    if (t.type === 'income') b.income += t.income ?? 0;
    else b.expense += t.expense ?? 0;
    buckets.set(k, b);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { income, expense }]) => ({
      date: formatLabel(key, granularity),
      income,
      expense,
      savingsRate: income === 0 ? 0 : Math.round(((income - expense) / income) * 10000) / 100,
    }));
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as SavingsDataPoint | undefined;
  if (!d) return null;
  const rateColor = d.savingsRate >= 0 ? 'text-green-600' : 'text-red-600';
  return (
    <div className="rounded-lg border bg-background p-3 text-xs shadow-xl space-y-1">
      <p className="font-medium">{label}</p>
      <p>Income: <span className="font-semibold">रु {d.income.toLocaleString()}</span></p>
      <p>Expense: <span className="font-semibold">रु {d.expense.toLocaleString()}</span></p>
      <p className={rateColor}>Savings Rate: <span className="font-semibold">{d.savingsRate.toFixed(2)}%</span></p>
    </div>
  );
};

interface Props {
  transactions: Transaction[];
}

export const SavingsRateTrendChart: React.FC<Props> = ({ transactions }) => {
  const [granularity, setGranularity] = useState<Granularity>('monthly');

  const data = useMemo(() => buildData(transactions, granularity), [transactions, granularity]);

  const hasNegative = data.some(d => d.savingsRate < 0);
  const minY = hasNegative ? Math.min(...data.map(d => d.savingsRate), -10) : -5;

  return (
    <Card className="border-green-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-green-700">Savings Rate Trend</CardTitle>
        <Tabs value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
          <TabsList className="h-8">
            <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs px-3">Weekly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">No transaction data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v: number) => `${v}%`}
                domain={[minY, 'auto']}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: '0% Break-even', position: 'insideTopRight', fontSize: 10 }} />
              <ReferenceLine y={20} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: '20% Healthy', position: 'insideTopRight', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="savingsRate"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ r: 3, fill: '#22C55E' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
