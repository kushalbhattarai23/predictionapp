import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const APP_LIST = [
  'tvShows', 'finance', 'movies', 'settlebill', 'household',
  'inventory', 'quickCommerce', 'images', 'sharedUniverse',
  'notifications', 'public', 'qa', 'admin'
] as const;

const APP_LABELS: Record<string, string> = {
  tvShows: 'TV Shows',
  finance: 'Finance',
  movies: 'Movies',
  settlebill: 'SettleBill',
  household: 'Household',
  inventory: 'Inventory',
  quickCommerce: 'Quick Commerce',
  images: 'Images',
  sharedUniverse: 'Shared Universe',
  notifications: 'Notifications',
  public: 'Public',
  qa: 'QA Bug Tracker',
  admin: 'Admin',
};

export const UserAppPermissions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allPreferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['admin-all-app-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_app_preferences')
        .select('user_id, app_name, enabled');
      if (error) throw error;
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ userId, appName, enabled }: { userId: string; appName: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('user_app_preferences')
        .upsert({
          user_id: userId,
          app_name: appName,
          enabled,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,app_name' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-app-preferences'] });
      toast.success('Permission updated');
    },
    onError: (err) => {
      toast.error('Failed to update: ' + (err as Error).message);
    },
  });

  const getAppEnabled = (userId: string, appName: string): boolean => {
    if (!allPreferences) return appName !== 'admin'; // default: all enabled except admin
    const pref = allPreferences.find(p => p.user_id === userId && p.app_name === appName);
    if (!pref) return appName !== 'admin';
    return pref.enabled;
  };

  const filteredUsers = users?.filter(u => {
    if (!searchTerm) return true;
    const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const isLoading = usersLoading || prefsLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User App Permissions
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground sticky left-0 bg-card z-10 min-w-[140px]">User</th>
                  {APP_LIST.map(app => (
                    <th key={app} className="text-center py-3 px-1 font-medium text-muted-foreground min-w-[80px]">
                      <span className="text-xs">{APP_LABELS[app]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers?.map(user => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 sticky left-0 bg-card z-10">
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</div>
                    </td>
                    {APP_LIST.map(app => {
                      const enabled = getAppEnabled(user.id, app);
                      return (
                        <td key={app} className="text-center py-3 px-1">
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) => {
                              toggleMutation.mutate({ userId: user.id, appName: app, enabled: checked });
                            }}
                            className="mx-auto"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {(!filteredUsers || filteredUsers.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
