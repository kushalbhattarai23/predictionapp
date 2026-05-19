import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, TooltipProps
} from 'recharts';
import type { Transaction } from '@/hooks/useTransactions';

type Granularity = 'daily' | 'weekly';

const PALETTE = ['#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const getWeekKey = (d: Date): string => {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

interface CategoryTotal {
  name: string;
  total: number;
}

interface Props {
  transactions: Transaction[];
}

export const CategoryBurnRateChart: React.FC<Props> = ({ transactions }) => {
  const [granularity, setGranularity] = useState<Granularity>('weekly');
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  // Top 5 expense categories
  const topCategories = useMemo<CategoryTotal[]>(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const name = t.categories?.name ?? 'Uncategorized';
      map.set(name, (map.get(name) ?? 0) + (t.expense ?? 0));
    }
    const sorted = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5).map(([name, total]) => ({ name, total }));
    const othersTotal = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
    if (othersTotal > 0) top5.push({ name: 'Others', total: othersTotal });
    return top5;
  }, [transactions]);

  const categoryNames = useMemo(() => topCategories.map(c => c.name), [topCategories]);
  const top5Set = useMemo(() => new Set(topCategories.slice(0, 5).map(c => c.name)), [topCategories]);

  // Fastest growing category
  const fastestGrowing = useMemo(() => {
    if (topCategories.length === 0) return '';
    return topCategories[0].name;
  }, [topCategories]);

  // Build chart data
  const data = useMemo(() => {
    const buckets = new Map<string, Map<string, { total: number; days: Set<string> }>>();

    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const d = new Date(t.date + 'T00:00:00');
      const key = granularity === 'daily' ? t.date : getWeekKey(d);
      const rawName = t.categories?.name ?? 'Uncategorized';
      const catName = top5Set.has(rawName) ? rawName : 'Others';

      if (!buckets.has(key)) buckets.set(key, new Map());
      const catMap = buckets.get(key)!;
      if (!catMap.has(catName)) catMap.set(catName, { total: 0, days: new Set() });
      const entry = catMap.get(catName)!;
      entry.total += t.expense ?? 0;
      entry.days.add(t.date);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, catMap]) => {
        const point: Record<string, string | number> = {
          date: granularity === 'daily'
            ? new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : key,
        };
        for (const name of categoryNames) {
          const entry = catMap.get(name);
          if (!entry) { point[name] = 0; continue; }
          const numDays = granularity === 'daily' ? 1 : Math.max(entry.days.size, 1);
          point[name] = Math.round((entry.total / numDays) * 100) / 100;
        }
        return point;
      });
  }, [transactions, granularity, categoryNames, top5Set]);

  const visibleCategories = categoryNames.filter(c => !hiddenCategories.has(c));

  const toggleCategory = (name: string) => {
    setHiddenCategories(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <Card className="border-green-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-green-700">Category Burn Rate</CardTitle>
          {fastestGrowing && (
            <Badge variant="destructive" className="text-xs">🔥 {fastestGrowing}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Filter className="h-3 w-3" /> Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3">
              <p className="text-xs font-medium mb-2">Categories</p>
              {categoryNames.map(name => (
                <label key={name} className="flex items-center gap-2 text-xs py-1 cursor-pointer">
                  <Checkbox
                    checked={!hiddenCategories.has(name)}
                    onCheckedChange={() => toggleCategory(name)}
                  />
                  {name}
                </label>
              ))}
            </PopoverContent>
          </Popover>
          <Tabs value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="text-xs px-3">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-3">Weekly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">No expense data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `रु${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }: TooltipProps<number, string>) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 text-xs shadow-xl space-y-1">
                      <p className="font-medium">{label}</p>
                      {payload.map(p => (
                        <p key={p.name} style={{ color: p.color }}>
                          {p.name}: <span className="font-semibold">रु {Number(p.value).toLocaleString()}</span>
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend />
              {visibleCategories.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={name === fastestGrowing ? 3 : 1.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
