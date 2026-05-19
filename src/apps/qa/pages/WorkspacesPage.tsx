import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQAWorkspaces, useCreateWorkspace, useDeleteWorkspace } from '../hooks/useQAData';
import { Link } from 'react-router-dom';
import { Plus, Trash2, FolderKanban } from 'lucide-react';
import { toast } from 'sonner';

const WorkspacesPage: React.FC = () => {
  const { data: workspaces = [], isLoading } = useQAWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    createWorkspace.mutate(form, {
      onSuccess: () => { setShowCreate(false); setForm({ name: '', description: '' }); toast.success('Workspace created'); },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QA Workspaces</h1>
          <p className="text-muted-foreground">Organize your QA boards by project or team</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />New Workspace</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link key={ws.id} to={`/qa/workspaces/${ws.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    {ws.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ws.description || 'No description'}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(ws.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {workspaces.length === 0 && (
            <p className="text-muted-foreground col-span-full">No workspaces yet. Create your first one!</p>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Workspace</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Workspace name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createWorkspace.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkspacesPage;
