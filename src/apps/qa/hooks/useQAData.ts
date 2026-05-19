import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCreateAppNotification } from '@/hooks/useCreateAppNotification';
import { QAWorkspace, QAWorkspaceMember, QABoard, QAList, QACard, QACardComment, QACardActivity, QACardAttachment, DEFAULT_LISTS } from '../types';

// ---- Workspaces ----
export const useQAWorkspaces = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['qa-workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_workspaces').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as QAWorkspace[];
    },
    enabled: !!user,
  });
};

export const useCreateWorkspace = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { notify } = useCreateAppNotification();
  return useMutation({
    mutationFn: async (values: { name: string; description?: string }) => {
      const { data, error } = await supabase.from('qa_workspaces').insert({ ...values, created_by: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['qa-workspaces'] });
      notify('qa_workspace_created', '🐛 Workspace Created', `"${data.name}" QA workspace was created`, { link: `/qa/workspaces/${data.id}` });
    },
  });
};

export const useDeleteWorkspace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('qa_workspaces').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qa-workspaces'] }),
  });
};

// ---- Workspace Members ----
export const useWorkspaceMembers = (workspaceId: string | undefined) => {
  return useQuery({
    queryKey: ['qa-workspace-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_workspace_members').select('*').eq('workspace_id', workspaceId!);
      if (error) throw error;
      return data as QAWorkspaceMember[];
    },
    enabled: !!workspaceId,
  });
};

export const useAddWorkspaceMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { workspace_id: string; user_id: string; role: string }) => {
      const { data, error } = await supabase.from('qa_workspace_members').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['qa-workspace-members', d.workspace_id] }),
  });
};

export const useRemoveWorkspaceMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('qa_workspace_members').delete().eq('id', id);
      if (error) throw error;
      return workspaceId;
    },
    onSuccess: (wsId) => qc.invalidateQueries({ queryKey: ['qa-workspace-members', wsId] }),
  });
};

export const useBoardById = (boardId: string | undefined) => {
  return useQuery({
    queryKey: ['qa-board', boardId],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_boards').select('*').eq('id', boardId!).single();
      if (error) throw error;
      return data as QABoard;
    },
    enabled: !!boardId,
  });
};

// ---- Boards ----
export const useQABoards = (workspaceId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['qa-boards', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_boards').select('*').eq('workspace_id', workspaceId!).eq('is_archived', false).order('created_at', { ascending: false });
      if (error) throw error;
      return data as QABoard[];
    },
    enabled: !!user && !!workspaceId,
  });
};

export const useCreateBoard = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { notify } = useCreateAppNotification();
  return useMutation({
    mutationFn: async (values: { workspace_id: string; title: string; description?: string }) => {
      const { data: board, error } = await supabase.from('qa_boards').insert({ ...values, created_by: user!.id }).select().single();
      if (error) throw error;
      const lists = DEFAULT_LISTS.map((title, i) => ({ board_id: board.id, title, position: i }));
      const { error: listError } = await supabase.from('qa_lists').insert(lists);
      if (listError) throw listError;
      return board;
    },
    onSuccess: (data, v) => {
      qc.invalidateQueries({ queryKey: ['qa-boards', v.workspace_id] });
      notify('qa_board_created', '📋 Board Created', `"${data.title}" board was created`, { link: `/qa/workspaces/${v.workspace_id}/boards/${data.id}` });
    },
  });
};

export const useDeleteBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('qa_boards').delete().eq('id', id);
      if (error) throw error;
      return workspaceId;
    },
    onSuccess: (wsId) => qc.invalidateQueries({ queryKey: ['qa-boards', wsId] }),
  });
};

// ---- Lists ----
export const useQALists = (boardId: string | undefined) => {
  return useQuery({
    queryKey: ['qa-lists', boardId],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_lists').select('*').eq('board_id', boardId!).order('position');
      if (error) throw error;
      return data as QAList[];
    },
    enabled: !!boardId,
  });
};

export const useCreateList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { board_id: string; title: string; position: number }) => {
      const { data, error } = await supabase.from('qa_lists').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['qa-lists', d.board_id] }),
  });
};

export const useUpdateListPositions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; position: number; board_id: string }[]) => {
      for (const u of updates) {
        const { error } = await supabase.from('qa_lists').update({ position: u.position }).eq('id', u.id);
        if (error) throw error;
      }
      return updates[0]?.board_id;
    },
    onSuccess: (boardId) => { if (boardId) qc.invalidateQueries({ queryKey: ['qa-lists', boardId] }); },
  });
};

// ---- Cards ----
export const useQACards = (boardId: string | undefined) => {
  return useQuery({
    queryKey: ['qa-cards', boardId],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_cards').select('*').eq('board_id', boardId!).order('position');
      if (error) throw error;
      return data as QACard[];
    },
    enabled: !!boardId,
  });
};

export const useCreateCard = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { notify } = useCreateAppNotification();
  return useMutation({
    mutationFn: async (values: Partial<QACard> & { board_id: string; list_id: string; title: string }) => {
      const { data, error } = await supabase.from('qa_cards').insert({ ...values, reported_by: user!.id }).select().single();
      if (error) throw error;
      await supabase.from('qa_card_activity').insert({ card_id: data.id, user_id: user!.id, action: 'created', details: `Created card "${data.title}"` });
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['qa-cards', d.board_id] });
      notify('qa_card_created', '🐛 Bug Reported', `"${d.title}" was reported`, { link: `/qa/workspaces` });
    },
  });
};

export const useUpdateCard = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, boardId, ...updates }: Partial<QACard> & { id: string; boardId: string }) => {
      const { data, error } = await supabase.from('qa_cards').update(updates).eq('id', id).select().single();
      if (error) throw error;
      if (updates.list_id) {
        await supabase.from('qa_card_activity').insert({ card_id: id, user_id: user!.id, action: 'moved', details: `Moved card` });
      }
      return { ...data, boardId };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['qa-cards', d.boardId] }),
  });
};

export const useDeleteCard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, boardId }: { id: string; boardId: string }) => {
      const { error } = await supabase.from('qa_cards').delete().eq('id', id);
      if (error) throw error;
      return boardId;
    },
    onSuccess: (boardId) => qc.invalidateQueries({ queryKey: ['qa-cards', boardId] }),
  });
};

// ---- Comments ----
export const useQAComments = (cardId: string | undefined) => {
  return useQuery({
    queryKey: ['qa-comments', cardId],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_card_comments').select('*').eq('card_id', cardId!).order('created_at', { ascending: true });
      if (error) throw error;
      return data as QACardComment[];
    },
    enabled: !!cardId,
  });
};

export const useAddComment = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, comment }: { cardId: string; comment: string }) => {
      const { data, error } = await supabase.from('qa_card_comments').insert({ card_id: cardId, user_id: user!.id, comment }).select().single();
      if (error) throw error;
      await supabase.from('qa_card_activity').insert({ card_id: cardId, user_id: user!.id, action: 'commented', details: comment.substring(0, 100) });
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['qa-comments', d.card_id] });
      qc.invalidateQueries({ queryKey: ['qa-activity', d.card_id] });
    },
  });
};

// ---- Activity ----
export const useQAActivity = (cardId: string | undefined) => {
  return useQuery({
    queryKey: ['qa-activity', cardId],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_card_activity').select('*').eq('card_id', cardId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data as QACardActivity[];
    },
    enabled: !!cardId,
  });
};

// ---- Attachments ----
export const useQAAttachments = (cardId: string | undefined) => {
  return useQuery({
    queryKey: ['qa-attachments', cardId],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_card_attachments').select('*').eq('card_id', cardId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data as QACardAttachment[];
    },
    enabled: !!cardId,
  });
};

export const useUploadAttachment = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, file }: { cardId: string; file: File }) => {
      const filePath = `${user!.id}/${cardId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('qa-attachments').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('qa-attachments').getPublicUrl(filePath);
      const { data, error } = await supabase.from('qa_card_attachments').insert({
        card_id: cardId, file_url: urlData.publicUrl, file_name: file.name, uploaded_by: user!.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['qa-attachments', d.card_id] }),
  });
};
