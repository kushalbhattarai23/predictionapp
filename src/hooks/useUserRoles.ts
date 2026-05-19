
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUserRoles() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('No user ID available for roles query');
        return [];
      }
      
      console.log('Fetching roles for user:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }
      
      const roles = data?.map(r => r.role) || [];
      console.log('User roles fetched:', roles);
      
      return roles;
    },
    enabled: !!userId,
    staleTime: 0, // Always refetch to get latest role data
    refetchOnWindowFocus: true,
  });

  const isAdmin = !!data?.includes('admin');
  
  console.log('Current user roles:', data, 'isAdmin:', isAdmin);

  return {
    roles: data,
    isAdmin,
    isLoading,
    error,
    refetch,
  };
}
