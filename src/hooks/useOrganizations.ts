
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationData {
  name: string;
  description?: string;
}

export const useOrganizations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as Organization[];
    },
    enabled: !!user
  });

  const createOrganization = useMutation({
    mutationFn: async (orgData: CreateOrganizationData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...orgData,
          creator_id: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({ title: 'Organization created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating organization', description: error.message, variant: 'destructive' });
    }
  });

  const updateOrganization = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Organization> & { id: string }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({ title: 'Organization updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating organization', description: error.message, variant: 'destructive' });
    }
  });

  const deleteOrganization = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({ title: 'Organization deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting organization', description: error.message, variant: 'destructive' });
    }
  });

  return {
    organizations,
    isLoading,
    createOrganization,
    updateOrganization,
    deleteOrganization
  };
};
