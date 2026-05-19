
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, ShieldCheck, UserPlus, Trash2 } from 'lucide-react';

interface UserRole {
  role: string;
}

interface UserWithRoles {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
  user_roles: UserRole[];
}

export const UserRoleManager: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with their roles using a more complex query
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users-with-roles'],
    queryFn: async () => {
      console.log('Fetching users with roles...');
      
      // First, get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles fetched:', profiles?.length || 0);

      // Then, get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      console.log('User roles fetched:', userRoles?.length || 0);

      // Combine the data
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: userRoles?.filter(role => role.user_id === profile.id)
          .map(role => ({ role: role.role })) || []
      })) || [];

      console.log('Combined users with roles:', usersWithRoles);
      return usersWithRoles;
    }
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      console.log('Adding role:', { userId, role });
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: 'Success',
        description: 'Role added successfully',
      });
      setSelectedUserId('');
      setSelectedRole('user');
    },
    onError: (error: any) => {
      console.error('Error adding role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add role',
        variant: 'destructive',
      });
    }
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      console.log('Removing role:', { userId, role });
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: 'Success',
        description: 'Role removed successfully',
      });
    },
    onError: (error: any) => {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove role',
        variant: 'destructive',
      });
    }
  });

  const handleAddRole = () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a user and role',
        variant: 'destructive',
      });
      return;
    }

    addRoleMutation.mutate({ userId: selectedUserId, role: selectedRole });
  };

  const handleRemoveRole = (userId: string, role: string) => {
    // Type assertion to ensure role is the correct type
    const validRole = role as 'admin' | 'user';
    removeRoleMutation.mutate({ userId, role: validRole });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Role to User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.id.slice(0, 8)}...)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-select">Select Role</Label>
              <Select value={selectedRole} onValueChange={(value: 'admin' | 'user') => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAddRole} 
                disabled={addRoleMutation.isPending || !selectedUserId}
                className="w-full"
              >
                {addRoleMutation.isPending ? 'Adding...' : 'Add Role'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Roles Management</CardTitle>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found. This might be because no user profiles have been created yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {user.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.user_roles?.length > 0 ? (
                          user.user_roles.map((roleObj, index) => (
                            <Badge 
                              key={index} 
                              variant={getRoleBadgeVariant(roleObj.role) as any}
                              className="flex items-center gap-1"
                            >
                              {getRoleIcon(roleObj.role)}
                              {roleObj.role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No roles assigned</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.user_roles?.map((roleObj, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveRole(user.id, roleObj.role)}
                            disabled={removeRoleMutation.isPending}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
