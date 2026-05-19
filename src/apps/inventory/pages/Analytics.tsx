import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInventoryItems, useInventoryTransactions } from '@/hooks/useInventory';
import { useCurrency } from '@/hooks/useCurrency';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const InventoryAnalytics: React.FC = () => {
  const { items } = useInventoryItems();
  const { transactions } = useInventoryTransactions();
  const { formatAmount } = useCurrency();

  const activeItems = items.filter(i => !i.is_archived);

  // Value by category
  const valueByCat: Record<string, number> = {};
  activeItems.forEach(i => {
    const cat = i.category?.name || 'Uncategorized';
    valueByCat[cat] = (valueByCat[cat] || 0) + i.quantity * i.purchase_price;
  });
  const valueData = Object.entries(valueByCat).map(([name, value]) => ({ name, value }));

  // Stock distribution
  const stockData = Object.entries(
    activeItems.reduce<Record<string, number>>((acc, i) => {
      const cat = i.category?.name || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + i.quantity;
      return acc;
    }, {})
  ).map(([name, quantity]) => ({ name, quantity }));

  // Consumption trend (last 30 days)
  const consumedTxs = transactions.filter(t => t.transaction_type === 'consumed');
  const last30 = new Date(); last30.setDate(last30.getDate() - 30);
  const dailyConsumption: Record<string, number> = {};
  consumedTxs.filter(t => new Date(t.created_at) >= last30).forEach(t => {
    const day = new Date(t.created_at).toLocaleDateString();
    dailyConsumption[day] = (dailyConsumption[day] || 0) + Math.abs(t.quantity_change);
  });
  const consumptionData = Object.entries(dailyConsumption).map(([date, amount]) => ({ date, amount }));

  // Top consumed items
  const consumptionByItem: Record<string, { name: string; total: number }> = {};
  consumedTxs.forEach(t => {
    const name = (t.item as any)?.name || 'Unknown';
    if (!consumptionByItem[t.item_id]) consumptionByItem[t.item_id] = { name, total: 0 };
    consumptionByItem[t.item_id].total += Math.abs(t.quantity_change);
  });
  const topConsumed = Object.values(consumptionByItem).sort((a, b) => b.total - a.total).slice(0, 10);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Inventory Analytics</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader><CardTitle className="text-foreground">Value by Category</CardTitle></CardHeader>
          <CardContent>
            {valueData.length === 0 ? <p className="text-muted-foreground">No data</p> : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valueData}><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader><CardTitle className="text-foreground">Stock Distribution</CardTitle></CardHeader>
          <CardContent>
            {stockData.length === 0 ? <p className="text-muted-foreground">No data</p> : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={stockData} dataKey="quantity" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {stockData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader><CardTitle className="text-foreground">Consumption Trend (30d)</CardTitle></CardHeader>
          <CardContent>
            {consumptionData.length === 0 ? <p className="text-muted-foreground">No consumption data</p> : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={consumptionData}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} /></LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader><CardTitle className="text-foreground">Top Consumed Items</CardTitle></CardHeader>
          <CardContent>
            {topConsumed.length === 0 ? <p className="text-muted-foreground">No data</p> : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topConsumed} layout="vertical"><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="total" fill="#EF4444" radius={[0,4,4,0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryAnalytics;
