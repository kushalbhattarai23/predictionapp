
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNetworks } from '@/hooks/useSettleBillNetworks';
import { useBills } from '@/hooks/useSettleGaraBills';
import { useUserBalances } from '@/hooks/useUserBalances';
import { useCurrency } from '@/hooks/useCurrency';
import { Users, Receipt, DollarSign, TrendingUp, TrendingDown, Plus, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const { data: networks, isLoading: networksLoading } = useNetworks();
  const { data: bills, isLoading: billsLoading } = useBills();
  const { data: balances } = useUserBalances();
  const { formatAmount } = useCurrency();

  const totalNetworks = networks?.length || 0;
  const totalBills = bills?.length || 0;
  const pendingBills = bills?.filter(bill => bill.status === 'pending').length || 0;
  const totalAmount = bills?.reduce((sum, bill) => sum + Number(bill.total_amount), 0) || 0;

  const recentBills = bills?.slice(0, 5) || [];
  const recentNetworks = networks?.slice(0, 3) || [];

  if (networksLoading || billsLoading) {
    return <div className="text-center py-8">Loading overview...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-red-700">Overview</h1>
          <p className="text-red-500">Track your bills and settlements</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="border border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Networks</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{totalNetworks}</div>
              <p className="text-xs text-muted-foreground">Active groups</p>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{totalBills}</div>
              <p className="text-xs text-muted-foreground">All time bills</p>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-orange-600">{pendingBills}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{formatAmount(totalAmount)}</div>
              <p className="text-xs text-muted-foreground">All bills combined</p>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">You Owe</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-red-600">{formatAmount(balances?.totalOwing || 0)}</div>
              <p className="text-xs text-muted-foreground">Outstanding debt</p>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Owed to You</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-green-600">{formatAmount(balances?.totalOwed || 0)}</div>
              <p className="text-xs text-muted-foreground">Money owed to you</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link to="/settlebill/networks/create">
                <Button className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4" />
                  Create Network
                </Button>
              </Link>
              <Link to="/settlebill/bills/create">
                <Button variant="outline" className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50">
                  <Plus className="w-4 h-4" />
                  Add Bill
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bills */}
          <Card className="border border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Bills</CardTitle>
              <Link to="/settlebill/bills">
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentBills.length > 0 ? (
                <div className="space-y-3">
                  {recentBills.map((bill) => (
                    <div key={bill.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{bill.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(bill.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={bill.status === 'settled' ? 'default' : 'destructive'}>
                          {bill.status}
                        </Badge>
                        <span className="font-semibold">{formatAmount(Number(bill.total_amount))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent bills</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Networks */}
          <Card className="border border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Networks</CardTitle>
              <Link to="/settlebill/networks">
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentNetworks.length > 0 ? (
                <div className="space-y-3">
                  {recentNetworks.map((network) => (
                    <div key={network.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{network.name}</p>
                        <p className="text-sm text-gray-500">
                          Created {new Date(network.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link to={`/settlebill/network/${network.id}`}>
                        <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No networks yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
