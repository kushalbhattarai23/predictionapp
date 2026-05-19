import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useQABoards, useCreateBoard, useDeleteBoard, useQAWorkspaces } from '../hooks/useQAData';
import { WorkspaceMemberManager } from '../components/WorkspaceMemberManager';
import { Plus, Trash2, LayoutDashboard, Users, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const WorkspaceDetailPage: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { data: workspaces = [] } = useQAWorkspaces();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  const { data: boards = [], isLoading } = useQABoards(workspaceId);
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const handleCreate = () => {
    if (!form.title.trim() || !workspaceId) { toast.error('Title required'); return; }
    createBoard.mutate(
      { workspace_id: workspaceId, title: form.title, description: form.description },
      { onSuccess: () => { setShowCreate(false); setForm({ title: '', description: '' }); toast.success('Board created with default lists'); } }
    );
  };

  const handleDelete = (boardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!workspaceId) return;
    deleteBoard.mutate({ id: boardId, workspaceId }, { onSuccess: () => toast.success('Board deleted') });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workspace?.name || 'Workspace'}</h1>
          <p className="text-muted-foreground">{workspace?.description || 'Boards in this workspace'}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/qa/workspaces/${workspaceId}/test-cases`}>
            <Button variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />Test Cases
            </Button>
          </Link>
          <Link to={`/qa/workspaces/${workspaceId}/test-coverage`}>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />Test Coverage
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowMembers(true)}>
            <Users className="h-4 w-4 mr-2" />Members
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />New Board
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link key={board.id} to={`/qa/boards/${board.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      {board.title}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleDelete(board.id, e)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{board.description || 'No description'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {boards.length === 0 && (
            <p className="text-muted-foreground col-span-full">No boards yet. Create your first board!</p>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Board</DialogTitle>
            <DialogDescription>Add a new Kanban board to this workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Board title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createBoard.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {workspaceId && (
        <WorkspaceMemberManager
          workspaceId={workspaceId}
          open={showMembers}
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  );
};

export default WorkspaceDetailPage;
