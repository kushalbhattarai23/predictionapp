import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NetworkMember } from '@/hooks/useSettleBillNetworks';
import { HouseholdCategory } from '@/hooks/useHouseholdCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { TrendingUp, PieChart, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';

interface Props {
  networkId: string;
  members: NetworkMember[];
  categories: HouseholdCategory[];
}

const COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#0284c7', '#0369a1', '#075985', '#6b7280', '#64748b'];

export const HouseholdAnalytics: React.FC<Props> = ({ networkId, members, categories }) => {
  const { formatAmount } = useCurrency();

  const { data: bills } = useQuery({
    queryKey: ['household-analytics-bills', networkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlegara_bills')
        .select('*')
        .eq('network_id', networkId)
        .eq('source_app', 'household')
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!networkId,
  });

  const monthlyData = useMemo(() => {
    if (!bills) return [];
    const months: Record<string, number> = {};
    bills.forEach(b => {
      const key = b.created_at.substring(0, 7);
      months[key] = (months[key] || 0) + Number(b.total_amount);
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, total]) => ({ month, total }));
  }, [bills]);

  const categoryData = useMemo(() => {
    if (!bills || !categories.length) return [];
    const catTotals: Record<string, number> = {};
    bills.forEach(b => {
      const desc = b.description || '';
      const catMatch = desc.match(/Category: (.+)/);
      const catName = catMatch ? catMatch[1] : 'Uncategorized';
      catTotals[catName] = (catTotals[catName] || 0) + Number(b.total_amount);
    });
    return Object.entries(catTotals).map(([name, value]) => ({ name, value }));
  }, [bills, categories]);

  const memberSpending = useMemo(() => {
    if (!bills || !members.length) return [];
    const spending: Record<string, number> = {};
    members.forEach(m => { spending[m.user_name] = 0; });
    bills.forEach(b => {
      const member = members.find(m => m.id === b.paid_by);
      if (member) spending[member.user_name] += Number(b.total_amount);
    });
    return Object.entries(spending).map(([name, amount]) => ({ name, amount }));
  }, [bills, members]);

  const totalSpending = bills?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
  const avgPerMember = members.length > 0 ? totalSpending / members.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Spending</p>
            <p className="text-2xl font-bold text-sky-600">{formatAmount(totalSpending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Avg per Member</p>
            <p className="text-2xl font-bold">{formatAmount(avgPerMember)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Bills</p>
            <p className="text-2xl font-bold">{bills?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Members</p>
            <p className="text-2xl font-bold">{members.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Monthly Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" /> Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Spending by Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          {memberSpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={memberSpending} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="amount" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-8">No data yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
