import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategories } from '@/hooks/useCategories';
import { ChevronLeft, ChevronRight, Filter, Flame } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, TooltipProps
} from 'recharts';
import { convertEnglishToNepali, convertNepaliToEnglish } from '@/utils/dateConverter';

const NEPALI_MONTHS = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'असोज',
  'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'
];
const ENGLISH_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const PALETTE = ['#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

type Granularity = 'daily' | 'weekly';

const getWeekKey = (d: Date): string => {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `W${String(week).padStart(2, '0')}`;
};

const CategoryBurnRate: React.FC = () => {
  const { transactions } = useTransactions();
  const { currency } = useCurrency();
  const currencySymbol = currency.symbol;
  const { categories } = useCategories();

  const [isNepali, setIsNepali] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>('weekly');
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  const now = new Date();
  const currentEngYear = now.getFullYear();
  const currentNepali = (() => {
    try { return convertEnglishToNepali(new Date(currentEngYear, now.getMonth(), 1)); } catch { return { year: 2082, month: 1, day: 1 }; }
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

  // Filter transactions for selected year
  const yearTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (isNepali) return t.nepali_date?.startsWith(`${selectedYear}`);
      return t.date.startsWith(`${selectedYear}`);
    }).filter(t => t.type === 'expense');
  }, [transactions, selectedYear, isNepali]);

  // Top 5 categories
  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of yearTransactions) {
      const name = t.categories?.name ?? 'Uncategorized';
      map.set(name, (map.get(name) ?? 0) + (t.expense ?? 0));
    }
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5).map(([name, total]) => ({ name, total }));
    const othersTotal = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
    if (othersTotal > 0) top5.push({ name: 'Others', total: othersTotal });
    return top5;
  }, [yearTransactions]);

  const categoryNames = useMemo(() => topCategories.map(c => c.name), [topCategories]);
  const top5Set = useMemo(() => new Set(topCategories.slice(0, 5).map(c => c.name)), [topCategories]);
  const fastestGrowing = topCategories.length > 0 ? topCategories[0].name : '';

  // Build chart data
  const data = useMemo(() => {
    const buckets = new Map<string, Map<string, { total: number; days: Set<string> }>>();

    for (const t of yearTransactions) {
      const d = new Date(t.date + 'T00:00:00');
      let key: string;
      if (granularity === 'daily') {
        if (isNepali) {
          key = t.nepali_date?.slice(0, 10) ?? t.date;
        } else {
          key = t.date;
        }
      } else {
        key = getWeekKey(d);
      }

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
        const point: Record<string, string | number> = { date: key };
        for (const name of categoryNames) {
          const entry = catMap.get(name);
          if (!entry) { point[name] = 0; continue; }
          const numDays = granularity === 'daily' ? 1 : Math.max(entry.days.size, 1);
          point[name] = Math.round((entry.total / numDays) * 100) / 100;
        }
        return point;
      });
  }, [yearTransactions, granularity, categoryNames, top5Set, isNepali]);

  const visibleCategories = categoryNames.filter(c => !hiddenCategories.has(c));

  const toggleCategory = (name: string) => {
    setHiddenCategories(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-700">Category Burn Rate</h1>
          <p className="text-muted-foreground text-sm">Track spending velocity per category over time</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm">EN</span>
            <Switch checked={isNepali} onCheckedChange={toggleCalendar} />
            <span className="text-sm">NP</span>
          </div>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {topCategories.slice(0, 5).map((cat, i) => (
          <Card key={cat.name} className="border-green-200">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE[i] }} />
                <p className="text-xs text-muted-foreground truncate">{cat.name}</p>
                {cat.name === fastestGrowing && <Flame className="h-3 w-3 text-orange-500" />}
              </div>
              <p className="text-lg font-bold mt-1">{currencySymbol}{cat.total.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Velocity chart */}
      <Card className="border-green-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-green-700 text-base">
            Burn Rate ({granularity === 'daily' ? 'per day' : 'per active day in week'})
          </CardTitle>
          {fastestGrowing && (
            <Badge variant="destructive" className="text-xs">🔥 {fastestGrowing}</Badge>
          )}
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No expense data for {selectedYear}</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }: TooltipProps<number, string>) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-background p-3 text-xs shadow-xl space-y-1">
                        <p className="font-semibold">{label}</p>
                        {payload.map(p => (
                          <p key={p.name} style={{ color: p.color }}>
                            {p.name}: <span className="font-semibold">{currencySymbol}{Number(p.value).toLocaleString()}</span>
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
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category data table */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700 text-base">Category Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Category</th>
                  <th className="text-right py-2 px-3">Total Spent</th>
                  <th className="text-right py-2 px-3">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {topCategories.map((cat, i) => {
                  const totalAll = topCategories.reduce((s, c) => s + c.total, 0);
                  const pct = totalAll === 0 ? 0 : Math.round((cat.total / totalAll) * 1000) / 10;
                  return (
                    <tr key={cat.name} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                          <span className="font-medium">{cat.name}</span>
                          {cat.name === fastestGrowing && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Top</Badge>}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">{currencySymbol}{cat.total.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryBurnRate;
