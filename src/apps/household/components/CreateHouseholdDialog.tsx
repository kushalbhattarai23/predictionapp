import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useInitializeHouseholdCategories } from '@/hooks/useHouseholdCategories';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateHouseholdDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const initCategories = useInitializeHouseholdCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: network, error } = await supabase
        .from('settlegara_networks')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          creator_id: user.id,
          network_type: 'household',
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase.from('settlegara_network_members').insert({
        network_id: network.id,
        user_email: user.email!,
        user_name: user.user_metadata?.full_name || user.email!.split('@')[0],
        role: 'admin',
        status: 'active',
      });

      // Initialize predefined categories
      await initCategories.mutateAsync(network.id);

      queryClient.invalidateQueries({ queryKey: ['household-networks'] });
      toast.success('Household created successfully!');
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Household</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hh-name">Household Name *</Label>
            <Input
              id="hh-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Apartment 4B, Family Home"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hh-desc">Description</Label>
            <Textarea
              id="hh-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this household..."
              rows={3}
              disabled={loading}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
              {loading ? 'Creating...' : 'Create Household'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
