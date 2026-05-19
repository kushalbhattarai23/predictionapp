import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Package, Clock, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { QCOrder } from '../hooks/useQCOrders';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const QCAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();

  const { data: allOrders = [] } = useQuery({
    queryKey: ['qc-analytics-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qc_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as QCOrder[];
    },
    enabled: !!user,
  });

  // Orders per day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStr = format(date, 'MMM d');
    const dayStart = startOfDay(date).getTime();
    const dayEnd = dayStart + 86400000;
    const count = allOrders.filter(o => {
      const t = new Date(o.created_at).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    return { day: dayStr, orders: count };
  });

  // Status distribution
  const statusCounts: Record<string, number> = {};
  allOrders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Revenue
  const totalRevenue = allOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const avgOrderValue = allOrders.length > 0
    ? allOrders.reduce((sum, o) => sum + Number(o.total_amount), 0) / allOrders.length
    : 0;

  // Revenue per day
  const revenuePerDay = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStr = format(date, 'MMM d');
    const dayStart = startOfDay(date).getTime();
    const dayEnd = dayStart + 86400000;
    const revenue = allOrders
      .filter(o => {
        const t = new Date(o.created_at).getTime();
        return t >= dayStart && t < dayEnd && o.status === 'delivered';
      })
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    return { day: dayStr, revenue };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-7 h-7" /> QuickCommerce Analytics
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm">Total Orders</span>
            </div>
            <p className="text-2xl font-bold">{allOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatAmount(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Avg Order</span>
            </div>
            <p className="text-2xl font-bold">{formatAmount(Math.round(avgOrderValue))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Delivered</span>
            </div>
            <p className="text-2xl font-bold">{allOrders.filter(o => o.status === 'delivered').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orders per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenuePerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QCAnalyticsPage;
