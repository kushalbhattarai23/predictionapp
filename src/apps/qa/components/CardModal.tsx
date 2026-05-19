import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QACard, QAList } from '../types';
import { useUpdateCard, useDeleteCard, useQAComments, useAddComment, useQAActivity, useQAAttachments, useUploadAttachment, useWorkspaceMembers } from '../hooks/useQAData';
import { toast } from 'sonner';
import { Trash2, Paperclip, MessageSquare, Activity, FileText, ImagePlus, User } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  card: QACard | null;
  lists: QAList[];
  boardId: string;
  workspaceId?: string;
  open: boolean;
  onClose: () => void;
}

export const CardModal: React.FC<Props> = ({ card, lists, boardId, workspaceId, open, onClose }) => {
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const { data: comments = [] } = useQAComments(card?.id);
  const { data: activity = [] } = useQAActivity(card?.id);
  const { data: attachments = [] } = useQAAttachments(card?.id);
  const { data: members = [] } = useWorkspaceMembers(workspaceId);
  const addComment = useAddComment();
  const uploadAttachment = useUploadAttachment();
  const [commentText, setCommentText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Partial<QACard>>({});

  // Sync editValues when card changes
  useEffect(() => {
    if (card) {
      setEditValues({
        title: card.title,
        description: card.description,
        bug_type: card.bug_type,
        severity: card.severity,
        priority: card.priority,
        environment: card.environment,
        module: card.module,
        steps_to_reproduce: card.steps_to_reproduce,
        expected_result: card.expected_result,
        actual_result: card.actual_result,
        due_date: card.due_date,
        assigned_to: card.assigned_to,
      });
    }
  }, [card]);

  if (!card) return null;

  const startEdit = () => {
    setEditing(true);
  };

  const saveEdit = () => {
    const payload: Record<string, unknown> = {};
    // Only send changed, non-undefined fields
    if (editValues.title !== undefined) payload.title = editValues.title;
    if (editValues.description !== undefined) payload.description = editValues.description || null;
    if (editValues.bug_type !== undefined) payload.bug_type = editValues.bug_type;
    if (editValues.severity !== undefined) payload.severity = editValues.severity;
    if (editValues.priority !== undefined) payload.priority = editValues.priority;
    if (editValues.environment !== undefined) payload.environment = editValues.environment || null;
    if (editValues.module !== undefined) payload.module = editValues.module || null;
    if (editValues.steps_to_reproduce !== undefined) payload.steps_to_reproduce = editValues.steps_to_reproduce || null;
    if (editValues.expected_result !== undefined) payload.expected_result = editValues.expected_result || null;
    if (editValues.actual_result !== undefined) payload.actual_result = editValues.actual_result || null;
    if (editValues.due_date !== undefined) payload.due_date = editValues.due_date || null;
    if (editValues.assigned_to !== undefined) payload.assigned_to = editValues.assigned_to || null;

    updateCard.mutate(
      { id: card.id, boardId, ...payload },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success('Card updated');
        },
        onError: (err) => {
          toast.error('Failed to update: ' + (err as Error).message);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteCard.mutate({ id: card.id, boardId }, { onSuccess: () => { onClose(); toast.success('Card deleted'); } });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment.mutate({ cardId: card.id, comment: commentText.trim() }, { onSuccess: () => setCommentText('') });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        uploadAttachment.mutate({ cardId: card.id, file }, { onSuccess: () => toast.success('File uploaded') });
      });
    }
  };

  const handleMoveToList = (listId: string) => {
    updateCard.mutate({ id: card.id, boardId, list_id: listId }, { onSuccess: () => toast.success('Card moved') });
  };

  const handleAssign = (userId: string) => {
    updateCard.mutate(
      { id: card.id, boardId, assigned_to: userId === 'unassigned' ? null : userId },
      { onSuccess: () => toast.success('Assignment updated') }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{card.title}</DialogTitle>
          <DialogDescription>Bug details and management</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mb-2">
          {card.bug_type && <Badge variant="outline">{card.bug_type}</Badge>}
          {card.severity && <Badge variant="outline">{card.severity}</Badge>}
          {card.priority && <Badge variant="outline">{card.priority}</Badge>}
          {card.module && <Badge variant="secondary">{card.module}</Badge>}
          {card.environment && <Badge variant="secondary">{card.environment}</Badge>}
        </div>

        {/* Move to list + Assign */}
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">List:</span>
            <Select value={card.list_id} onValueChange={handleMoveToList}>
              <SelectTrigger className="w-48 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {lists.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {members.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Assign:</span>
              <Select value={card.assigned_to || 'unassigned'} onValueChange={handleAssign}>
                <SelectTrigger className="w-48 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.user_id.substring(0, 8)}...</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1"><FileText className="h-3 w-3 mr-1" />Details</TabsTrigger>
            <TabsTrigger value="comments" className="flex-1"><MessageSquare className="h-3 w-3 mr-1" />Comments ({comments.length})</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1"><Activity className="h-3 w-3 mr-1" />Activity</TabsTrigger>
            <TabsTrigger value="attachments" className="flex-1"><Paperclip className="h-3 w-3 mr-1" />Files ({attachments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3 mt-3">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={editValues.title || ''} onChange={(e) => setEditValues({ ...editValues, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Bug Type</Label>
                    <Input value={editValues.bug_type || ''} onChange={(e) => setEditValues({ ...editValues, bug_type: e.target.value })} placeholder="e.g. Bug, Improvement" />
                  </div>
                  <div>
                    <Label className="text-xs">Severity</Label>
                    <Input value={editValues.severity || ''} onChange={(e) => setEditValues({ ...editValues, severity: e.target.value })} placeholder="e.g. Critical, High" />
                  </div>
                  <div>
                    <Label className="text-xs">Priority</Label>
                    <Input value={editValues.priority || ''} onChange={(e) => setEditValues({ ...editValues, priority: e.target.value })} placeholder="e.g. P1, P2" />
                  </div>
                  <div>
                    <Label className="text-xs">Environment</Label>
                    <Input value={editValues.environment || ''} onChange={(e) => setEditValues({ ...editValues, environment: e.target.value })} placeholder="e.g. Production" />
                  </div>
                  <div>
                    <Label className="text-xs">Module</Label>
                    <Input value={editValues.module || ''} onChange={(e) => setEditValues({ ...editValues, module: e.target.value })} placeholder="e.g. Finance" />
                  </div>
                  <div>
                    <Label className="text-xs">Due Date</Label>
                    <Input type="date" value={editValues.due_date || ''} onChange={(e) => setEditValues({ ...editValues, due_date: e.target.value || null })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea value={editValues.description || ''} onChange={(e) => setEditValues({ ...editValues, description: e.target.value })} rows={3} />
                </div>
                <div>
                  <Label className="text-xs">Steps to Reproduce</Label>
                  <Textarea value={editValues.steps_to_reproduce || ''} onChange={(e) => setEditValues({ ...editValues, steps_to_reproduce: e.target.value })} rows={3} />
                </div>
                <div>
                  <Label className="text-xs">Expected Result</Label>
                  <Textarea value={editValues.expected_result || ''} onChange={(e) => setEditValues({ ...editValues, expected_result: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label className="text-xs">Actual Result</Label>
                  <Textarea value={editValues.actual_result || ''} onChange={(e) => setEditValues({ ...editValues, actual_result: e.target.value })} rows={2} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} disabled={updateCard.isPending}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Bug Type:</span> <span className="font-medium">{card.bug_type || '—'}</span></div>
                  <div><span className="text-muted-foreground">Severity:</span> <span className="font-medium">{card.severity || '—'}</span></div>
                  <div><span className="text-muted-foreground">Priority:</span> <span className="font-medium">{card.priority || '—'}</span></div>
                  <div><span className="text-muted-foreground">Environment:</span> <span className="font-medium">{card.environment || '—'}</span></div>
                  <div><span className="text-muted-foreground">Module:</span> <span className="font-medium">{card.module || '—'}</span></div>
                  <div><span className="text-muted-foreground">Due Date:</span> <span className="font-medium">{card.due_date || '—'}</span></div>
                </div>
                {card.description && <div><p className="text-xs font-medium text-muted-foreground mb-1">Description</p><p className="text-sm whitespace-pre-wrap">{card.description}</p></div>}
                {card.steps_to_reproduce && <div><p className="text-xs font-medium text-muted-foreground mb-1">Steps to Reproduce</p><p className="text-sm whitespace-pre-wrap">{card.steps_to_reproduce}</p></div>}
                {card.expected_result && <div><p className="text-xs font-medium text-muted-foreground mb-1">Expected Result</p><p className="text-sm whitespace-pre-wrap">{card.expected_result}</p></div>}
                {card.actual_result && <div><p className="text-xs font-medium text-muted-foreground mb-1">Actual Result</p><p className="text-sm whitespace-pre-wrap">{card.actual_result}</p></div>}
                {!card.description && !card.steps_to_reproduce && !card.expected_result && !card.actual_result && (
                  <p className="text-sm text-muted-foreground italic">No details added yet. Click Edit to add.</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={startEdit}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={handleDelete}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-3 mt-3">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="bg-muted/50 rounded-md p-2">
                  <p className="text-sm">{c.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(c.created_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleComment()} />
              <Button size="sm" onClick={handleComment}>Send</Button>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-3">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">{a.action}</span>
                    {a.details && <span className="text-muted-foreground"> — {a.details}</span>}
                    <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {attachments.map((a) => (
                <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer" className="block border rounded-md overflow-hidden hover:shadow-md transition-shadow">
                  {a.file_name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                    <img src={a.file_url} alt={a.file_name} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="h-24 flex items-center justify-center bg-muted">
                      <Paperclip className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-xs p-1 truncate text-muted-foreground">{a.file_name}</p>
                </a>
              ))}
            </div>
            {attachments.length === 0 && <p className="text-sm text-muted-foreground">No attachments yet.</p>}
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
              <ImagePlus className="h-4 w-4" />
              Upload screenshots / files
              <input type="file" multiple accept="image/*,video/*,.log,.txt,.pdf" onChange={handleFileUpload} className="hidden" />
            </label>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
