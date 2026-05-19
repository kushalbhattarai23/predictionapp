import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, Plus, TrendingUp, BarChart3, Tag } from 'lucide-react';
import { useInventoryItems } from '@/hooks/useInventory';
import { useCurrency } from '@/hooks/useCurrency';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const InventoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { items, isLoading } = useInventoryItems();
  const { formatAmount } = useCurrency();

  const activeItems = items.filter(i => !i.is_archived);
  const lowStockItems = activeItems.filter(i => i.quantity <= i.min_stock && i.min_stock > 0);
  const totalValue = activeItems.reduce((sum, i) => sum + i.quantity * i.purchase_price, 0);
  const recentItems = activeItems.slice(0, 5);

  // Category distribution
  const categoryMap: Record<string, { name: string; count: number }> = {};
  activeItems.forEach(item => {
    const catName = item.category?.name || 'Uncategorized';
    if (!categoryMap[catName]) categoryMap[catName] = { name: catName, count: 0 };
    categoryMap[catName].count++;
  });
  const categoryData = Object.values(categoryMap);

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading inventory...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Dashboard</h1>
          <p className="text-muted-foreground">Track and manage your inventory</p>
        </div>
        <Button onClick={() => navigate('/inventory/items')} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{activeItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-destructive">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/50">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">{formatAmount(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Tag className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-foreground">{categoryData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">All items are well stocked!</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category?.name || 'No category'}</p>
                    </div>
                    <Badge variant="destructive">
                      {item.quantity} / {item.min_stock} {item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="h-5 w-5 text-primary" /> Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No items yet</p>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, count }) => `${name} (${count})`}>
                      {categoryData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Recent Items</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/inventory/items')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {recentItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">No items added yet</p>
          ) : (
            <div className="space-y-2">
              {recentItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.location || 'No location'} · {item.category?.name || 'Uncategorized'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{item.quantity} {item.unit}</p>
                    <p className="text-xs text-muted-foreground">{formatAmount(item.purchase_price)}/unit</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;
