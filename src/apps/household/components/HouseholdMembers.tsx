import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAddNetworkMember, useRemoveNetworkMember } from '@/hooks/useSettleBillNetworks';
import { useLogHouseholdActivity } from '@/hooks/useHouseholdActivity';
import { NetworkMember } from '@/hooks/useSettleBillNetworks';
import { Users, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  networkId: string;
  members: NetworkMember[];
}

export const HouseholdMembers: React.FC<Props> = ({ networkId, members }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const addMember = useAddNetworkMember();
  const removeMember = useRemoveNetworkMember();
  const logActivity = useLogHouseholdActivity();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await addMember.mutateAsync({
        network_id: networkId,
        user_name: name,
        user_email: email,
        role: 'member',
        status: 'active',
      });

      logActivity.mutate({
        network_id: networkId,
        actor_name: user?.email || 'User',
        actor_email: user?.email || null,
        action_type: 'member_added',
        description: `Added ${name} to the household`,
        metadata: {},
      });

      toast.success(`${name} added to household`);
      setName('');
      setEmail('');
      setShowAdd(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    try {
      await removeMember.mutateAsync({ memberId, networkId });
      toast.success(`${memberName} removed`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Members ({members.length})
        </CardTitle>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map(m => (
          <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">{m.user_name}</p>
              <p className="text-sm text-muted-foreground">{m.user_email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={m.role === 'admin' ? 'default' : 'secondary'}>{m.role}</Badge>
              {m.role !== 'admin' && (
                <Button variant="ghost" size="icon" onClick={() => handleRemove(m.id, m.user_name)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Household Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={addMember.isPending}>
              {addMember.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
