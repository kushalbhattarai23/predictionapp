export interface QAWorkspace {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface QAWorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface QABoard {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QAList {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
}

export interface QACard {
  id: string;
  board_id: string;
  list_id: string;
  title: string;
  description: string | null;
  bug_type: string;
  severity: string;
  priority: string;
  status: string;
  module: string | null;
  environment: string | null;
  steps_to_reproduce: string | null;
  expected_result: string | null;
  actual_result: string | null;
  reported_by: string | null;
  assigned_to: string | null;
  due_date: string | null;
  position: number;
  labels: string[];
  created_at: string;
  updated_at: string;
}

export interface QACardComment {
  id: string;
  card_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

export interface QACardActivity {
  id: string;
  card_id: string;
  user_id: string | null;
  action: string;
  details: string | null;
  created_at: string;
}

export interface QACardAttachment {
  id: string;
  card_id: string;
  file_url: string;
  file_name: string;
  uploaded_by: string | null;
  created_at: string;
}

export const BUG_TYPES = ['Bug', 'Improvement', 'Task', 'Test Case'] as const;
export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
export const ENVIRONMENTS = ['Production', 'Staging', 'Development'] as const;
export const QA_MODULES = [
  'Finance', 'Movies', 'TV Shows', 'Inventory', 'SettleBill',
  'Household', 'Shared Universe', 'Authentication', 'Admin', 'QA', 'Images', 'QuickCommerce'
] as const;

export const DEFAULT_LISTS = [
  'Backlog',
  'Ready for QA',
  'In Testing',
  'Bug Found',
  'Fix In Progress',
  'Ready for Retest',
  'Done',
];
