import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAddNetworkMember } from '@/hooks/useSettleBillNetworks';
import { useAllNetworkMembers } from '@/hooks/useAllNetworkMembers';
import { InviteMemberForm } from './InviteMemberForm';
import { X, AlertCircle, UserPlus, Mail, Users, Plus, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddMemberFormProps {
  networkId: string;
  networkName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddMemberForm: React.FC<AddMemberFormProps> = ({ 
  networkId, 
  networkName, 
  onClose, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const addMemberMutation = useAddNetworkMember();
  const { data: allMembers = [] } = useAllNetworkMembers();
  const [activeTab, setActiveTab] = useState('existing');
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    role: 'member'
  });
  const [newMembers, setNewMembers] = useState<Array<{ user_name: string; user_email: string; role: string }>>([
    { user_name: '', user_email: '', role: 'member' }
  ]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const handleAddRow = () => {
    setNewMembers(prev => [...prev, { user_name: '', user_email: '', role: 'member' }]);
  };

  const handleRemoveRow = (index: number) => {
    setNewMembers(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index: number, field: 'user_name' | 'user_email' | 'role', value: string) => {
    setNewMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleSubmitMultiple = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validRows = newMembers.filter(m => m.user_name.trim());
    if (validRows.length === 0) {
      setError('Add at least one member with a name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const m of validRows) {
      if (m.user_email.trim() && !emailRegex.test(m.user_email.trim())) {
        setError(`Invalid email for ${m.user_name}`);
        return;
      }
    }

    setIsAdding(true);
    let successCount = 0;
    try {
      for (const m of validRows) {
        const name = m.user_name.trim();
        const email = m.user_email.trim().toLowerCase() || `${name.toLowerCase().replace(/\s+/g, '.')}@placeholder.local`;
        await new Promise<void>((resolve, reject) => {
          addMemberMutation.mutate({
            network_id: networkId,
            user_name: name,
            user_email: email,
            role: m.role,
            status: 'active',
          }, {
            onSuccess: () => { successCount++; resolve(); },
            onError: (err) => reject(err),
          });
        });
      }
      toast({
        title: 'Members Added',
        description: `${successCount} member(s) added successfully.`,
      });
      setNewMembers([{ user_name: '', user_email: '', role: 'member' }]);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error adding members:', err);
      setError(err.message || `Failed after adding ${successCount} member(s)`);
    } finally {
      setIsAdding(false);
    }
  };

  // Filter out members already in current network (check if any of their networks match current networkId)
  const baseAvailableMembers = allMembers.filter(m => 
    !m.networks.some(n => n.network_id === networkId)
  );

  const availableMembers = memberSearch.trim()
    ? baseAvailableMembers.filter(m => {
        const q = memberSearch.trim().toLowerCase();
        return (
          m.user_name.toLowerCase().includes(q) ||
          (m.user_email || '').toLowerCase().includes(q) ||
          m.networks.some(n => n.network_name.toLowerCase().includes(q))
        );
      })
    : baseAvailableMembers;

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === availableMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(availableMembers.map(m => m.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.user_name.trim()) {
      setError('Member name is required');
      return;
    }

    if (formData.user_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.user_email)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    const memberData = {
      network_id: networkId,
      user_name: formData.user_name.trim(),
      user_email: formData.user_email.trim().toLowerCase() || `${formData.user_name.trim().toLowerCase().replace(/\s+/g, '.')}@placeholder.local`,
      role: formData.role,
      status: 'active'
    };

    addMemberMutation.mutate(memberData, {
      onSuccess: () => {
        toast({
          title: 'Member Added',
          description: 'Member has been successfully added to the network.',
        });
        setFormData({
          user_name: '',
          user_email: '',
          role: 'member'
        });
        onSuccess?.();
        onClose();
      },
      onError: (error) => {
        console.error('Error adding member:', error);
        setError(error.message || 'Failed to add member');
        toast({
          title: 'Error',
          description: 'Failed to add member. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleAddSelectedMembers = async () => {
    if (selectedMembers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      for (const memberId of selectedMembers) {
        const member = allMembers.find(m => m.id === memberId);
        if (!member) continue;

        await new Promise<void>((resolve, reject) => {
          addMemberMutation.mutate({
            network_id: networkId,
            user_name: member.user_name,
            user_email: member.user_email,
            role: formData.role,
            status: 'active'
          }, {
            onSuccess: () => resolve(),
            onError: (err) => reject(err)
          });
        });
      }

      toast({
        title: 'Members Added',
        description: `${selectedMembers.length} member(s) added to the network.`,
      });
      setSelectedMembers([]);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error adding members:', error);
      setError(error.message || 'Failed to add some members');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Add Network Member</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              From Networks
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add New
            </TabsTrigger>
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invite
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="mt-4">
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Select members from your other networks to add to this network.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {baseAvailableMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No members from other networks available to add.</p>
                <p className="text-sm mt-2">Add new members using the "Add New" tab.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name, email, or network..."
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center justify-between py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="select-all"
                      checked={availableMembers.length > 0 && selectedMembers.length === availableMembers.length}
                      onCheckedChange={handleSelectAll}
                      disabled={availableMembers.length === 0}
                    />
                    <Label htmlFor="select-all" className="font-medium cursor-pointer">
                      Select All ({availableMembers.length} {memberSearch.trim() ? 'matching' : 'members'})
                    </Label>
                  </div>
                  {selectedMembers.length > 0 && (
                    <span className="text-sm text-primary font-medium">
                      {selectedMembers.length} selected
                    </span>
                  )}
                </div>

                <ScrollArea className="h-[250px] border rounded-lg p-2">
                  {availableMembers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No members match "{memberSearch}".
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {availableMembers.map((member) => (
                        <div 
                          key={member.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedMembers.includes(member.id) 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => handleToggleMember(member.id)}
                        >
                          <Checkbox 
                            id={`member-${member.id}`}
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={() => handleToggleMember(member.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {member.user_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              From: {member.networks.map(n => n.network_name).join(', ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="space-y-2">
                  <Label>Role for selected members</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button 
                    onClick={handleAddSelectedMembers}
                    disabled={isAdding || selectedMembers.length === 0}
                    className="flex-1"
                  >
                    {isAdding ? 'Adding...' : `Add ${selectedMembers.length} Member(s)`}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                Add one or more new members at once. Email is optional.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmitMultiple} className="space-y-4">
              <ScrollArea className="max-h-[360px] pr-2">
                <div className="space-y-3">
                  {newMembers.map((m, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Member {idx + 1}</span>
                        {newMembers.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRow(idx)}
                            disabled={isAdding}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          value={m.user_name}
                          onChange={(e) => handleUpdateRow(idx, 'user_name', e.target.value)}
                          placeholder="Name *"
                          disabled={isAdding}
                        />
                        <Input
                          type="email"
                          value={m.user_email}
                          onChange={(e) => handleUpdateRow(idx, 'user_email', e.target.value)}
                          placeholder="Email (optional)"
                          disabled={isAdding}
                        />
                      </div>
                      <Select
                        value={m.role}
                        onValueChange={(value) => handleUpdateRow(idx, 'role', value)}
                        disabled={isAdding}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddRow}
                disabled={isAdding}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add another member
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isAdding || newMembers.every(m => !m.user_name.trim())}
                  className="flex-1"
                >
                  {isAdding ? 'Adding...' : `Add ${newMembers.filter(m => m.user_name.trim()).length || ''} Member(s)`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isAdding}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="invite" className="mt-4">
            <InviteMemberForm
              networkId={networkId}
              networkName={networkName}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
