
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Mail, Calendar, Users as UsersIcon, Shield, AppWindow } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleManager } from '../components/UserRoleManager';
import { UserAppPermissions } from '../components/UserAppPermissions';

export const AdminUsers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          created_at,
          user_show_tracking (count)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>

        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Management
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <AppWindow className="h-4 w-4" />
            App Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {isLoading ? (
            <div className="text-center py-12">Loading users...</div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  All Users ({users?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback className="bg-purple-100 text-purple-700">
                            {getInitials(user.first_name, user.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">
                            {user.first_name} {user.last_name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              ID: {user.id.slice(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">
                          {user.user_show_tracking?.length || 0} shows tracked
                        </Badge>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles">
          <UserRoleManager />
        </TabsContent>

        <TabsContent value="permissions">
          <UserAppPermissions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsers;
