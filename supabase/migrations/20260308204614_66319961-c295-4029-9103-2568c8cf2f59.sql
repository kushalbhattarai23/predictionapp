
-- First recreate the functions
CREATE OR REPLACE FUNCTION public.is_qa_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.qa_workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  ) OR EXISTS (
    SELECT 1 FROM public.qa_workspaces
    WHERE id = _workspace_id AND created_by = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_qa_board_member(_user_id uuid, _board_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.qa_boards b
    WHERE b.id = _board_id
    AND public.is_qa_workspace_member(_user_id, b.workspace_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_qa_card_member(_user_id uuid, _card_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.qa_cards c
    WHERE c.id = _card_id
    AND public.is_qa_board_member(_user_id, c.board_id)
  );
$$;

-- Now drop ALL existing policies on all QA tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('qa_workspaces','qa_workspace_members','qa_boards','qa_lists','qa_cards','qa_card_comments','qa_card_activity','qa_card_attachments')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- qa_workspaces
CREATE POLICY "qa_ws_insert" ON public.qa_workspaces FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "qa_ws_select" ON public.qa_workspaces FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.is_qa_workspace_member(auth.uid(), id));
CREATE POLICY "qa_ws_update" ON public.qa_workspaces FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "qa_ws_delete" ON public.qa_workspaces FOR DELETE TO authenticated USING (created_by = auth.uid());

-- qa_workspace_members
CREATE POLICY "qa_wm_select" ON public.qa_workspace_members FOR SELECT TO authenticated USING (public.is_qa_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "qa_wm_insert" ON public.qa_workspace_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "qa_wm_delete" ON public.qa_workspace_members FOR DELETE TO authenticated USING (public.is_qa_workspace_member(auth.uid(), workspace_id));

-- qa_boards
CREATE POLICY "qa_b_select" ON public.qa_boards FOR SELECT TO authenticated USING (public.is_qa_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "qa_b_insert" ON public.qa_boards FOR INSERT TO authenticated WITH CHECK (public.is_qa_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "qa_b_update" ON public.qa_boards FOR UPDATE TO authenticated USING (public.is_qa_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "qa_b_delete" ON public.qa_boards FOR DELETE TO authenticated USING (public.is_qa_workspace_member(auth.uid(), workspace_id));

-- qa_lists
CREATE POLICY "qa_l_select" ON public.qa_lists FOR SELECT TO authenticated USING (public.is_qa_board_member(auth.uid(), board_id));
CREATE POLICY "qa_l_insert" ON public.qa_lists FOR INSERT TO authenticated WITH CHECK (public.is_qa_board_member(auth.uid(), board_id));
CREATE POLICY "qa_l_update" ON public.qa_lists FOR UPDATE TO authenticated USING (public.is_qa_board_member(auth.uid(), board_id));
CREATE POLICY "qa_l_delete" ON public.qa_lists FOR DELETE TO authenticated USING (public.is_qa_board_member(auth.uid(), board_id));

-- qa_cards
CREATE POLICY "qa_c_select" ON public.qa_cards FOR SELECT TO authenticated USING (public.is_qa_board_member(auth.uid(), board_id));
CREATE POLICY "qa_c_insert" ON public.qa_cards FOR INSERT TO authenticated WITH CHECK (public.is_qa_board_member(auth.uid(), board_id));
CREATE POLICY "qa_c_update" ON public.qa_cards FOR UPDATE TO authenticated USING (public.is_qa_board_member(auth.uid(), board_id));
CREATE POLICY "qa_c_delete" ON public.qa_cards FOR DELETE TO authenticated USING (public.is_qa_board_member(auth.uid(), board_id));

-- qa_card_comments
CREATE POLICY "qa_cc_select" ON public.qa_card_comments FOR SELECT TO authenticated USING (public.is_qa_card_member(auth.uid(), card_id));
CREATE POLICY "qa_cc_insert" ON public.qa_card_comments FOR INSERT TO authenticated WITH CHECK (public.is_qa_card_member(auth.uid(), card_id));

-- qa_card_activity
CREATE POLICY "qa_ca_select" ON public.qa_card_activity FOR SELECT TO authenticated USING (public.is_qa_card_member(auth.uid(), card_id));
CREATE POLICY "qa_ca_insert" ON public.qa_card_activity FOR INSERT TO authenticated WITH CHECK (public.is_qa_card_member(auth.uid(), card_id));

-- qa_card_attachments
CREATE POLICY "qa_att_select" ON public.qa_card_attachments FOR SELECT TO authenticated USING (public.is_qa_card_member(auth.uid(), card_id));
CREATE POLICY "qa_att_insert" ON public.qa_card_attachments FOR INSERT TO authenticated WITH CHECK (public.is_qa_card_member(auth.uid(), card_id));
