
-- Create tables first without RLS policies

CREATE TABLE public.qa_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.qa_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.qa_workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE public.qa_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.qa_workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.qa_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES public.qa_boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.qa_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES public.qa_boards(id) ON DELETE CASCADE NOT NULL,
  list_id UUID REFERENCES public.qa_lists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  bug_type TEXT NOT NULL DEFAULT 'bug',
  severity TEXT NOT NULL DEFAULT 'medium',
  priority TEXT NOT NULL DEFAULT 'P3',
  status TEXT NOT NULL DEFAULT 'open',
  module TEXT,
  environment TEXT DEFAULT 'development',
  steps_to_reproduce TEXT,
  expected_result TEXT,
  actual_result TEXT,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.qa_card_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.qa_cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.qa_card_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.qa_cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.qa_card_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.qa_cards(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.qa_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_card_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_card_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_card_attachments ENABLE ROW LEVEL SECURITY;

-- Now create RLS policies (qa_workspace_members exists now)
CREATE POLICY "Users can view their own workspaces" ON public.qa_workspaces
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.qa_workspace_members WHERE workspace_id = qa_workspaces.id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can create workspaces" ON public.qa_workspaces
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Workspace creators can update" ON public.qa_workspaces
  FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Workspace creators can delete" ON public.qa_workspaces
  FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Members can view workspace members" ON public.qa_workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.qa_workspace_members wm WHERE wm.workspace_id = qa_workspace_members.workspace_id AND wm.user_id = auth.uid()
  ));
CREATE POLICY "Workspace creators can manage members" ON public.qa_workspace_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.qa_workspaces WHERE id = qa_workspace_members.workspace_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can view boards" ON public.qa_boards
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.qa_workspaces w WHERE w.id = qa_boards.workspace_id AND (w.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.qa_workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
    ))
  ));
CREATE POLICY "Users can create boards" ON public.qa_boards
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Board creators can update" ON public.qa_boards
  FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Board creators can delete" ON public.qa_boards
  FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can view lists" ON public.qa_lists
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.qa_boards b JOIN public.qa_workspaces w ON b.workspace_id = w.id
    WHERE b.id = qa_lists.board_id AND (w.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.qa_workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
    ))
  ));
CREATE POLICY "Users can manage lists" ON public.qa_lists
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.qa_boards b JOIN public.qa_workspaces w ON b.workspace_id = w.id
    WHERE b.id = qa_lists.board_id AND (w.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.qa_workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can view cards" ON public.qa_cards
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.qa_boards b JOIN public.qa_workspaces w ON b.workspace_id = w.id
    WHERE b.id = qa_cards.board_id AND (w.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.qa_workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
    ))
  ));
CREATE POLICY "Users can manage cards" ON public.qa_cards
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.qa_boards b JOIN public.qa_workspaces w ON b.workspace_id = w.id
    WHERE b.id = qa_cards.board_id AND (w.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.qa_workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can view comments" ON public.qa_card_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.qa_cards c JOIN public.qa_boards b ON c.board_id = b.id JOIN public.qa_workspaces w ON b.workspace_id = w.id
    WHERE c.id = qa_card_comments.card_id AND (w.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.qa_workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
    ))
  ));
CREATE POLICY "Users can add comments" ON public.qa_card_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.qa_card_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view activity" ON public.qa_card_activity
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.qa_cards c JOIN public.qa_boards b ON c.board_id = b.id JOIN public.qa_workspaces w ON b.workspace_id = w.id
    WHERE c.id = qa_card_activity.card_id AND (w.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.qa_workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
    ))
  ));
CREATE POLICY "Users can add activity" ON public.qa_card_activity
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view attachments" ON public.qa_card_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.qa_cards c JOIN public.qa_boards b ON c.board_id = b.id JOIN public.qa_workspaces w ON b.workspace_id = w.id
    WHERE c.id = qa_card_attachments.card_id AND (w.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.qa_workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
    ))
  ));
CREATE POLICY "Users can add attachments" ON public.qa_card_attachments
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Users can delete own attachments" ON public.qa_card_attachments
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('qa-attachments', 'qa-attachments', true);

CREATE POLICY "Auth users upload qa attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'qa-attachments');
CREATE POLICY "Anyone view qa attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'qa-attachments');

-- Triggers
CREATE TRIGGER update_qa_workspaces_updated_at BEFORE UPDATE ON public.qa_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_qa_boards_updated_at BEFORE UPDATE ON public.qa_boards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_qa_cards_updated_at BEFORE UPDATE ON public.qa_cards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
