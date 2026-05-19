import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateCard, useUploadAttachment } from '../hooks/useQAData';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  boardId: string;
  listId: string;
}

export const BugForm: React.FC<Props> = ({ open, onClose, boardId, listId }) => {
  const createCard = useCreateCard();
  const uploadAttachment = useUploadAttachment();
  const [form, setForm] = useState({
    title: '',
    description: '',
    bug_type: '',
    severity: '',
    priority: '',
    environment: '',
    module: '',
    steps_to_reproduce: '',
    expected_result: '',
    actual_result: '',
  });
  const [screenshots, setScreenshots] = useState<File[]>([]);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    createCard.mutate(
      {
        board_id: boardId,
        list_id: listId,
        title: form.title,
        description: form.description || null,
        bug_type: form.bug_type || 'Bug',
        severity: form.severity || 'Medium',
        priority: form.priority || 'P3',
        environment: form.environment || null,
        module: form.module || null,
        steps_to_reproduce: form.steps_to_reproduce || null,
        expected_result: form.expected_result || null,
        actual_result: form.actual_result || null,
      },
      {
        onSuccess: async (data) => {
          // Upload screenshots
          for (const file of screenshots) {
            try {
              await uploadAttachment.mutateAsync({ cardId: data.id, file });
            } catch (err) {
              console.error('Failed to upload screenshot:', err);
            }
          }
          toast.success('Bug created');
          setForm({ title: '', description: '', bug_type: '', severity: '', priority: '', environment: '', module: '', steps_to_reproduce: '', expected_result: '', actual_result: '' });
          setScreenshots([]);
          onClose();
        },
      }
    );
  };

  const handleScreenshotAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setScreenshots(prev => [...prev, ...Array.from(files)]);
    }
    e.target.value = '';
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Bug</DialogTitle>
          <DialogDescription>Fill in the bug details below. All text fields are free-form.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input placeholder="Bug title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Bug Type</Label>
              <Input placeholder="e.g. Bug, Improvement, Task" value={form.bug_type} onChange={(e) => setForm({ ...form, bug_type: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Severity</Label>
              <Input placeholder="e.g. Critical, High, Medium, Low" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Input placeholder="e.g. P1, P2, P3, P4" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Environment</Label>
              <Input placeholder="e.g. Production, Staging, Dev" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Module</Label>
            <Input placeholder="e.g. Finance, Movies, Inventory" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea placeholder="Describe the bug..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label className="text-xs">Steps to Reproduce</Label>
            <Textarea placeholder="1. Go to...\n2. Click on...\n3. See error" value={form.steps_to_reproduce} onChange={(e) => setForm({ ...form, steps_to_reproduce: e.target.value })} rows={3} />
          </div>
          <div>
            <Label className="text-xs">Expected Result</Label>
            <Textarea placeholder="What should happen?" value={form.expected_result} onChange={(e) => setForm({ ...form, expected_result: e.target.value })} rows={2} />
          </div>
          <div>
            <Label className="text-xs">Actual Result</Label>
            <Textarea placeholder="What actually happened?" value={form.actual_result} onChange={(e) => setForm({ ...form, actual_result: e.target.value })} rows={2} />
          </div>

          {/* Screenshots */}
          <div>
            <Label className="text-xs">Screenshots / Attachments</Label>
            <div className="mt-1 space-y-2">
              {screenshots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {screenshots.map((file, i) => (
                    <div key={i} className="relative group">
                      <div className="w-20 h-20 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground text-center px-1">{file.name}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeScreenshot(i)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
                <ImagePlus className="h-4 w-4" />
                Add screenshots
                <input type="file" multiple accept="image/*,video/*,.log,.txt,.pdf" onChange={handleScreenshotAdd} className="hidden" />
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createCard.isPending}>Create Bug</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
