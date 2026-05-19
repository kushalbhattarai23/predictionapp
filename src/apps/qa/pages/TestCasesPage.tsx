import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Download, Upload, Trash2, Save, FileSpreadsheet } from 'lucide-react';
import { useTestCases, useCreateTestCase, useUpdateTestCase, useDeleteTestCase, useBulkCreateTestCases, QATestCase } from '../hooks/useTestCases';
import { useQAWorkspaces } from '../hooks/useQAData';
import { downloadStyledExcel, ExcelSection } from '@/utils/excelUtils';
import { parseCSV } from '@/utils/csvUtils';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { key: 'test_case_id', label: 'TC ID', width: 'w-24', multiline: false },
  { key: 'module', label: 'Module', width: 'w-28', multiline: false },
  { key: 'title', label: 'Title', width: 'w-48', multiline: false },
  { key: 'description', label: 'Description', width: 'w-56', multiline: false },
  { key: 'preconditions', label: 'Preconditions', width: 'w-44', multiline: true },
  { key: 'steps', label: 'Steps', width: 'w-64', multiline: true },
  { key: 'expected_result', label: 'Expected Result', width: 'w-48', multiline: true },
  { key: 'actual_result', label: 'Actual Result', width: 'w-48', multiline: true },
  { key: 'status', label: 'Status', width: 'w-28', multiline: false },
  { key: 'priority', label: 'Priority', width: 'w-24', multiline: false },
  { key: 'assigned_to', label: 'Assigned To', width: 'w-32', multiline: false },
  { key: 'notes', label: 'Notes', width: 'w-44', multiline: true },
] as const;

const STATUS_OPTIONS = ['Not Run', 'Pass', 'Fail', 'Blocked', 'In Progress', 'Skipped'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];

const statusColors: Record<string, string> = {
  'Pass': 'bg-green-500/15 text-green-700 dark:text-green-400',
  'Fail': 'bg-destructive/15 text-destructive',
  'Blocked': 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  'In Progress': 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  'Not Run': 'bg-muted text-muted-foreground',
  'Skipped': 'bg-muted text-muted-foreground',
};

type EditableRow = Partial<QATestCase> & { _isNew?: boolean; _dirty?: boolean };

const TestCasesPage: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { data: workspaces = [] } = useQAWorkspaces();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  const { data: testCases = [], isLoading } = useTestCases(workspaceId);
  const createTC = useCreateTestCase();
  const updateTC = useUpdateTestCase();
  const deleteTC = useDeleteTestCase();
  const bulkCreate = useBulkCreateTestCases();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<EditableRow[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [filterModule, setFilterModule] = useState<string>('all');

  useEffect(() => {
    if (testCases.length > 0 || !isLoading) {
      setRows(testCases.map((tc) => ({ ...tc })));
    }
  }, [testCases, isLoading]);

  const modules = Array.from(new Set(rows.map((r) => r.module).filter(Boolean)));
  const filteredRows = filterModule === 'all' ? rows : rows.filter((r) => r.module === filterModule);

  const handleCellChange = (rowIdx: number, colKey: string, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      const actualIdx = filterModule === 'all' ? rowIdx : prev.indexOf(filteredRows[rowIdx]);
      updated[actualIdx] = { ...updated[actualIdx], [colKey]: value, _dirty: true };
      return updated;
    });
  };

  const saveRow = async (row: EditableRow) => {
    if (!workspaceId || !row._dirty) return;
    const { _isNew, _dirty, id, created_at, updated_at, created_by, ...values } = row as any;
    try {
      if (_isNew) {
        await createTC.mutateAsync({ workspace_id: workspaceId, ...values });
      } else if (id) {
        await updateTC.mutateAsync({ id, workspace_id: workspaceId, ...values });
      }
      toast.success(`Saved ${row.test_case_id || 'row'}`);
    } catch (err) {
      toast.error(`Failed to save: ${(err as Error).message}`);
    }
  };

  const addRow = () => {
    const nextId = `TC-${String(rows.length + 1).padStart(3, '0')}`;
    setRows((prev) => [
      ...prev,
      {
        _isNew: true,
        _dirty: true,
        test_case_id: nextId,
        module: filterModule !== 'all' ? filterModule : '',
        title: '',
        description: '',
        preconditions: '',
        steps: '',
        expected_result: '',
        actual_result: '',
        status: 'Not Run',
        priority: 'Medium',
        assigned_to: '',
        notes: '',
      },
    ]);
  };

  const removeRow = (rowIdx: number) => {
    const row = filteredRows[rowIdx];
    if (row.id && workspaceId) {
      deleteTC.mutate({ id: row.id, workspace_id: workspaceId }, { onSuccess: () => toast.success('Deleted') });
    }
    setRows((prev) => prev.filter((r) => r !== row));
  };

  const saveAll = async () => {
    if (!workspaceId) return;
    const dirtyRows = rows.filter((r) => r._dirty);
    let saved = 0;
    for (const row of dirtyRows) {
      const { _isNew, _dirty, id, created_at, updated_at, created_by, ...values } = row as any;
      try {
        if (_isNew) {
          await createTC.mutateAsync({ workspace_id: workspaceId, ...values });
        } else if (id) {
          await updateTC.mutateAsync({ id, workspace_id: workspaceId, ...values });
        }
        saved++;
      } catch (err) {
        toast.error(`Failed to save row ${row.test_case_id}: ${(err as Error).message}`);
      }
    }
    if (saved > 0) toast.success(`Saved ${saved} test case(s)`);
  };

  const handleExport = () => {
    if (!workspaceId) return;
    const section: ExcelSection = {
      title: `Test Cases - ${workspace?.name || 'Workspace'}${filterModule !== 'all' ? ` (${filterModule})` : ''}`,
      columns: COLUMNS.map((c) => ({ key: c.key, label: c.label, type: 'text' as const })),
      rows: filteredRows.map((r) => {
        const obj: Record<string, string> = {};
        COLUMNS.forEach((c) => { obj[c.key] = (r as any)[c.key] || ''; });
        return obj;
      }),
    };
    downloadStyledExcel({
      filename: `test_cases_${workspace?.name || 'workspace'}`,
      workbookTitle: `Test Cases - ${workspace?.name || 'Workspace'}`,
      sections: [section],
    });
    toast.success('Exported to Excel');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) { toast.error('No data found in CSV'); return; }
        const mapped = parsed.map((row: any) => {
          const r: Partial<QATestCase> = {};
          const keys = Object.keys(row);
          const find = (search: string) => keys.find((k) => k.toLowerCase().replace(/[\s_-]/g, '') === search.toLowerCase().replace(/[\s_-]/g, '')) || '';
          r.test_case_id = row[find('testcaseid')] || row[find('tcid')] || '';
          r.module = row[find('module')] || '';
          r.title = row[find('title')] || '';
          r.description = row[find('description')] || '';
          r.preconditions = row[find('preconditions')] || '';
          r.steps = row[find('steps')] || '';
          r.expected_result = row[find('expectedresult')] || '';
          r.actual_result = row[find('actualresult')] || '';
          r.status = row[find('status')] || 'Not Run';
          r.priority = row[find('priority')] || 'Medium';
          r.assigned_to = row[find('assignedto')] || '';
          r.notes = row[find('notes')] || '';
          return r;
        });
        bulkCreate.mutate(
          { workspace_id: workspaceId, rows: mapped },
          {
            onSuccess: () => toast.success(`Imported ${mapped.length} test cases`),
            onError: (err) => toast.error('Import failed: ' + (err as Error).message),
          }
        );
      } catch {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderCell = (row: EditableRow, rowIdx: number, col: typeof COLUMNS[number]) => {
    const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colKey === col.key;
    const value = (row as any)[col.key] || '';

    if (col.key === 'status') {
      return (
        <select
          className="w-full h-full bg-transparent border-0 text-xs focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
          value={value}
          onChange={(e) => handleCellChange(rowIdx, col.key, e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      );
    }

    if (col.key === 'priority') {
      return (
        <select
          className="w-full h-full bg-transparent border-0 text-xs focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
          value={value}
          onChange={(e) => handleCellChange(rowIdx, col.key, e.target.value)}
        >
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      );
    }

    if (isEditing && col.multiline) {
      return (
        <textarea
          autoFocus
          className="w-full bg-transparent border-0 text-xs focus:outline-none px-1 py-1 resize-none min-h-[60px]"
          rows={4}
          value={value}
          onChange={(e) => handleCellChange(rowIdx, col.key, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              // Ctrl+Enter: insert new line
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              const pos = target.selectionStart;
              const newVal = value.slice(0, pos) + '\n' + value.slice(pos);
              handleCellChange(rowIdx, col.key, newVal);
            } else if (e.key === 'Enter' && !e.ctrlKey) {
              // Enter: save and close
              e.preventDefault();
              setEditingCell(null);
              saveRow(filteredRows[rowIdx]);
            } else if (e.key === 'Tab') {
              e.preventDefault();
              const colIdx = COLUMNS.findIndex((c) => c.key === col.key);
              const nextCol = COLUMNS[colIdx + 1];
              if (nextCol) setEditingCell({ rowIdx, colKey: nextCol.key });
              else setEditingCell(null);
            }
          }}
        />
      );
    }

    if (isEditing) {
      return (
        <input
          autoFocus
          className="w-full h-full bg-transparent border-0 text-xs focus:outline-none px-1"
          value={value}
          onChange={(e) => handleCellChange(rowIdx, col.key, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setEditingCell(null);
              saveRow(filteredRows[rowIdx]);
            }
            if (e.key === 'Tab') {
              e.preventDefault();
              const colIdx = COLUMNS.findIndex((c) => c.key === col.key);
              const nextCol = COLUMNS[colIdx + 1];
              if (nextCol) setEditingCell({ rowIdx, colKey: nextCol.key });
              else setEditingCell(null);
            }
          }}
        />
      );
    }

    // Show multiline content properly
    if (col.multiline && value && value.includes('\n')) {
      return (
        <div
          className="w-full px-1 py-1 text-xs cursor-text min-h-[24px] whitespace-pre-wrap"
          onClick={() => setEditingCell({ rowIdx, colKey: col.key })}
        >
          {value}
        </div>
      );
    }

    return (
      <div
        className="w-full h-full px-1 text-xs truncate cursor-text min-h-[24px] flex items-center"
        onClick={() => setEditingCell({ rowIdx, colKey: col.key })}
      >
        {value || <span className="text-muted-foreground/50">—</span>}
      </div>
    );
  };

  // Coverage stats
  const total = filteredRows.length;
  const pass = filteredRows.filter((r) => r.status === 'Pass').length;
  const fail = filteredRows.filter((r) => r.status === 'Fail').length;
  const blocked = filteredRows.filter((r) => r.status === 'Blocked').length;
  const notRun = filteredRows.filter((r) => r.status === 'Not Run').length;
  const inProgress = filteredRows.filter((r) => r.status === 'In Progress').length;
  const coveragePct = total > 0 ? Math.round((pass / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Test Cases
          </h1>
          <p className="text-sm text-muted-foreground">{workspace?.name || 'Workspace'} — Ctrl+Enter for new line, Enter to save</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map((m) => <SelectItem key={m} value={m!}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={addRow}><Plus className="h-4 w-4 mr-1" />Add Row</Button>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" />Import CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export Excel</Button>
          <Button size="sm" onClick={saveAll} disabled={!rows.some((r) => r._dirty)}>
            <Save className="h-4 w-4 mr-1" />Save All
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* Coverage summary bar */}
      <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30 text-xs flex-wrap">
        <span className="font-semibold">Coverage: {coveragePct}%</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[100px]">
          <div className="h-full flex">
            <div className="bg-green-500 h-full" style={{ width: `${total > 0 ? (pass / total) * 100 : 0}%` }} />
            <div className="bg-destructive h-full" style={{ width: `${total > 0 ? (fail / total) * 100 : 0}%` }} />
            <div className="bg-yellow-500 h-full" style={{ width: `${total > 0 ? (blocked / total) * 100 : 0}%` }} />
            <div className="bg-blue-500 h-full" style={{ width: `${total > 0 ? (inProgress / total) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="flex gap-3">
          <span className="text-green-600 dark:text-green-400">✓ {pass} Pass</span>
          <span className="text-destructive">✗ {fail} Fail</span>
          <span className="text-yellow-600 dark:text-yellow-400">⊘ {blocked} Blocked</span>
          <span className="text-blue-600 dark:text-blue-400">◎ {inProgress} In Progress</span>
          <span className="text-muted-foreground">○ {notRun} Not Run</span>
        </div>
      </div>

      {/* Spreadsheet table */}
      <div className="border rounded-lg overflow-auto bg-card">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/70">
              <th className="border border-border px-2 py-2 text-left font-semibold w-8">#</th>
              {COLUMNS.map((col) => (
                <th key={col.key} className={cn('border border-border px-2 py-2 text-left font-semibold', col.width)}>
                  {col.label}
                </th>
              ))}
              <th className="border border-border px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={COLUMNS.length + 2} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={COLUMNS.length + 2} className="text-center py-8 text-muted-foreground">No test cases. Click "Add Row" to start.</td></tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr
                  key={row.id || `new-${idx}`}
                  className={cn(
                    'hover:bg-muted/30 transition-colors',
                    row._dirty && 'bg-primary/5',
                    row.status === 'Fail' && 'bg-destructive/5',
                    row.status === 'Pass' && 'bg-green-500/5',
                  )}
                >
                  <td className="border border-border px-2 py-1 text-muted-foreground text-center">{idx + 1}</td>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className={cn('border border-border px-0 py-0 align-top', col.width)}>
                      {col.key === 'status' ? (
                        <div className="px-1">
                          <Badge variant="secondary" className={cn('text-[10px] font-normal', statusColors[row.status || 'Not Run'])}>
                            {renderCell(row, idx, col)}
                          </Badge>
                        </div>
                      ) : renderCell(row, idx, col)}
                    </td>
                  ))}
                  <td className="border border-border px-1 py-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(idx)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filteredRows.length} test case(s){filterModule !== 'all' ? ` in "${filterModule}"` : ''}</span>
        <span>Coverage: {coveragePct}% | Pass: {pass} | Fail: {fail} | Not Run: {notRun}</span>
      </div>
    </div>
  );
};

export default TestCasesPage;
