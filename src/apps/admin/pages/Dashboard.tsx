import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Tv, Globe, Database, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      const { count: showCount } = await supabase
        .from('shows')
        .select('*', { count: 'exact', head: true });
      const { count: universeCount } = await supabase
        .from('universes')
        .select('*', { count: 'exact', head: true });
      const { count: trackingCount } = await supabase
        .from('user_show_tracking')
        .select('*', { count: 'exact', head: true });
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        userCount: userCount || 0,
        showCount: showCount || 0,
        universeCount: universeCount || 0,
        trackingCount: trackingCount || 0,
        recentUsers: recentUsers || [],
      };
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">Loading admin data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.userCount}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shows</CardTitle>
            <Tv className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.showCount}</div>
            <p className="text-xs text-muted-foreground">TV shows in database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Universes</CardTitle>
            <Globe className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.universeCount}</div>
            <p className="text-xs text-muted-foreground">Created universes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tracking</CardTitle>
            <Activity className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trackingCount}</div>
            <p className="text-xs text-muted-foreground">Show tracking records</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{user.first_name} {user.last_name}</p>
                    <p className="text-sm text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline">New</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">Database</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">API</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-600">v1.0.0</div>
                <p className="text-xs text-muted-foreground">Version</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
