
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

export type Request = Database['public']['Tables']['requests']['Row'];
export type NewRequest = Database['public']['Tables']['requests']['Insert'];
export type UpdateRequest = Database['public']['Tables']['requests']['Update'];

export function useRequests({ isAdmin = false } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['requests', user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('requests')
        .select('*');

      if (!isAdmin) {
        query = query.eq('user_id', user.id)
      }
      
      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }
      return data;
    },
    enabled: !!user,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (newRequest: NewRequest) => {
      const { data, error: mutationError } = await supabase
        .from('requests')
        .insert(newRequest)
        .select()
        .single();
        
      if (mutationError) {
        throw mutationError;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & UpdateRequest) => {
      const { data, error: mutationError } = await supabase
        .from('requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (mutationError) {
        throw mutationError;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  return {
    requests,
    isLoading,
    error,
    createRequest: createRequestMutation.mutateAsync,
    updateRequest: updateRequestMutation.mutateAsync,
  };
}
