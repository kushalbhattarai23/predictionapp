import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface QATestCase {
  id: string;
  workspace_id: string;
  module: string;
  test_case_id: string;
  title: string;
  description: string;
  preconditions: string;
  steps: string;
  expected_result: string;
  actual_result: string;
  status: string;
  priority: string;
  assigned_to: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useTestCases = (workspaceId: string | undefined) => {
  return useQuery({
    queryKey: ['qa-test-cases', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qa_test_cases')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as QATestCase[];
    },
    enabled: !!workspaceId,
  });
};

export const useCreateTestCase = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<QATestCase> & { workspace_id: string }) => {
      const { data, error } = await supabase
        .from('qa_test_cases')
        .insert({ ...values, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['qa-test-cases', d.workspace_id] }),
  });
};

export const useUpdateTestCase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workspace_id, ...updates }: Partial<QATestCase> & { id: string; workspace_id: string }) => {
      const { data, error } = await supabase
        .from('qa_test_cases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, workspace_id };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['qa-test-cases', d.workspace_id] }),
  });
};

export const useDeleteTestCase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workspace_id }: { id: string; workspace_id: string }) => {
      const { error } = await supabase.from('qa_test_cases').delete().eq('id', id);
      if (error) throw error;
      return workspace_id;
    },
    onSuccess: (wsId) => qc.invalidateQueries({ queryKey: ['qa-test-cases', wsId] }),
  });
};

export const useBulkCreateTestCases = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspace_id, rows }: { workspace_id: string; rows: Partial<QATestCase>[] }) => {
      const toInsert = rows.map((r) => ({ ...r, workspace_id, created_by: user!.id }));
      const { error } = await supabase.from('qa_test_cases').insert(toInsert);
      if (error) throw error;
      return workspace_id;
    },
    onSuccess: (wsId) => qc.invalidateQueries({ queryKey: ['qa-test-cases', wsId] }),
  });
};
