import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

export interface PageMetadata {
  id: string;
  route: string;
  title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  canonical_url: string | null;
  created_at: string;
  updated_at: string;
}

export type PageMetadataInsert = Omit<PageMetadata, 'id' | 'created_at' | 'updated_at'>;

const DEFAULT_TITLE = 'modular-app-universe';

export function useAllPageMetadata() {
  return useQuery({
    queryKey: ['page-metadata'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_metadata')
        .select('*')
        .order('route');
      if (error) throw error;
      return data as PageMetadata[];
    },
  });
}

export function useCurrentPageMetadata() {
  const location = useLocation();
  const route = location.pathname;

  return useQuery({
    queryKey: ['page-metadata', route],
    queryFn: async () => {
      // Try exact match first, then try prefix matches for dynamic routes
      const { data, error } = await supabase
        .from('page_metadata')
        .select('*')
        .eq('route', route)
        .maybeSingle();
      if (error) throw error;
      return data as PageMetadata | null;
    },
  });
}

export function usePageMetadataMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (metadata: PageMetadataInsert) => {
      const { data, error } = await supabase
        .from('page_metadata')
        .insert(metadata)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['page-metadata'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PageMetadata> & { id: string }) => {
      const { data, error } = await supabase
        .from('page_metadata')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['page-metadata'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('page_metadata')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['page-metadata'] }),
  });

  return { createMutation, updateMutation, deleteMutation };
}

export function getPageTitle(metadata: PageMetadata | null | undefined): string {
  return metadata?.title || DEFAULT_TITLE;
}

export function getMetaDescription(metadata: PageMetadata | null | undefined): string {
  return metadata?.meta_description || '';
}
