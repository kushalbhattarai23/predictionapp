
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useCreateAppNotification } from '@/hooks/useCreateAppNotification';

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  organization_id?: string;
  created_at: string;
}

export const useCategories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentOrganization, isPersonalMode } = useOrganizationContext();
  const { notify } = useCreateAppNotification();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', user?.id, currentOrganization?.id, isPersonalMode],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase.from('categories').select('*');
      
      if (isPersonalMode) {
        // Show only personal categories (no organization_id)
        query = query.eq('user_id', user.id).is('organization_id', null);
      } else if (currentOrganization) {
        // Show only company categories for the selected organization
        query = query.eq('organization_id', currentOrganization.id);
      } else {
        // If not personal mode but no organization selected, show nothing
        return [];
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      return data as Category[];
    },
    enabled: !!user
  });

  const createCategory = useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at' | 'user_id' | 'organization_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const categoryData = {
        ...category,
        user_id: user.id,
        organization_id: isPersonalMode ? null : currentOrganization?.id || null
      };
      
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category created successfully' });
      notify('category_created', '🏷️ Category Created', `"${data.name}" category was created`, { link: '/finance/categories' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating category', description: error.message, variant: 'destructive' });
    }
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating category', description: error.message, variant: 'destructive' });
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category deleted successfully' });
      notify('category_deleted', '🗑️ Category Deleted', 'A category was deleted', { link: '/finance/categories' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting category', description: error.message, variant: 'destructive' });
    }
  });

  return {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory
  };
};
