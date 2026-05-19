
CREATE TABLE public.qa_test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.qa_workspaces(id) ON DELETE CASCADE NOT NULL,
  module text NOT NULL DEFAULT '',
  test_case_id text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  preconditions text DEFAULT '',
  steps text DEFAULT '',
  expected_result text DEFAULT '',
  actual_result text DEFAULT '',
  status text NOT NULL DEFAULT 'Not Run',
  priority text DEFAULT 'Medium',
  assigned_to text DEFAULT '',
  notes text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_test_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_tc_select" ON public.qa_test_cases FOR SELECT TO authenticated
  USING (public.is_qa_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "qa_tc_insert" ON public.qa_test_cases FOR INSERT TO authenticated
  WITH CHECK (public.is_qa_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "qa_tc_update" ON public.qa_test_cases FOR UPDATE TO authenticated
  USING (public.is_qa_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "qa_tc_delete" ON public.qa_test_cases FOR DELETE TO authenticated
  USING (public.is_qa_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER qa_test_cases_updated_at
  BEFORE UPDATE ON public.qa_test_cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
