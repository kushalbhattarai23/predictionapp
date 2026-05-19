import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceMembers, useAddWorkspaceMember, useRemoveWorkspaceMember } from '../hooks/useQAData';
import { toast } from 'sonner';
import { UserPlus, Trash2, Users } from 'lucide-react';

interface Props {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
}

export const WorkspaceMemberManager: React.FC<Props> = ({ workspaceId, open, onClose }) => {
  const { data: members = [], isLoading } = useWorkspaceMembers(workspaceId);
  const addMember = useAddWorkspaceMember();
  const removeMember = useRemoveWorkspaceMember();
  const [userId, setUserId] = useState('');

  const handleAdd = () => {
    const trimmed = userId.trim();
    if (!trimmed) { toast.error('User ID is required'); return; }
    addMember.mutate(
      { workspace_id: workspaceId, user_id: trimmed, role: 'member' },
      {
        onSuccess: () => { setUserId(''); toast.success('Member added'); },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  const handleRemove = (memberId: string) => {
    removeMember.mutate(
      { id: memberId, workspaceId },
      { onSuccess: () => toast.success('Member removed') }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Workspace Members</DialogTitle>
          <DialogDescription>Add users by their user ID to allow bug assignment.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="User ID (UUID)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={addMember.isPending} size="sm">
              <UserPlus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-mono truncate">{m.user_id}</span>
                  <Badge variant="secondary" className="text-[10px]">{m.role}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleRemove(m.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            {!isLoading && members.length === 0 && (
              <p className="text-sm text-muted-foreground">No members added yet. The workspace creator has access by default.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
