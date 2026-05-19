import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAllNetworkMembers } from '@/hooks/useAllNetworkMembers';
import { useNetworks, useUpdateNetworkMember } from '@/hooks/useSettleBillNetworks';
import { AddMemberForm } from '../components/AddMemberForm';
import { Users, ChevronRight, UserPlus, Pencil, Save, X, Wallet, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EditingMember {
  id: string;
  networkId: string;
  user_name: string;
  user_email: string;
}

export const MembersPage: React.FC = () => {
  const { data: members, isLoading, refetch } = useAllNetworkMembers();
  const { data: networks, isLoading: networksLoading } = useNetworks();
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('');
  const [editingMember, setEditingMember] = useState<EditingMember | null>(null);
  const updateMemberMutation = useUpdateNetworkMember();
  const [walletDialogMember, setWalletDialogMember] = useState<{ memberId: string; networkId: string; memberName: string } | null>(null);
  const [walletImages, setWalletImages] = useState<{ id: string; url: string; file_name: string; file_path: string }[]>([]);
  const [isUploadingWallet, setIsUploadingWallet] = useState(false);
  const walletInputRef = useRef<HTMLInputElement>(null);

  const selectedNetwork = networks?.find(n => n.id === selectedNetworkId);

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId);
  };

  const handleCloseAddMember = () => {
    setShowAddMember(false);
    setSelectedNetworkId('');
  };

  const handleEditMember = (member: any, network: any) => {
    setEditingMember({
      id: member.id,
      networkId: network.network_id,
      user_name: member.user_name,
      user_email: member.user_email
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;
    
    try {
      await updateMemberMutation.mutateAsync({
        id: editingMember.id,
        networkId: editingMember.networkId,
        user_name: editingMember.user_name,
        user_email: editingMember.user_email
      });
      toast.success('Member updated successfully');
      setEditingMember(null);
      refetch();
    } catch (error) {
      toast.error('Failed to update member');
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
  };

  const fetchWalletImages = async (memberIds: string[]) => {
    const { data, error } = await supabase
      .from('settlegara_member_wallet_images')
      .select('*')
      .in('member_id', memberIds)
      .order('created_at', { ascending: false });
    if (error || !data) return;
    // Deduplicate by file_path
    const seen = new Set<string>();
    const unique = data.filter((img: any) => {
      if (seen.has(img.file_path)) return false;
      seen.add(img.file_path);
      return true;
    });
    setWalletImages(unique.map((img: any) => ({
      id: img.id,
      url: supabase.storage.from('settlebill-images').getPublicUrl(img.file_path).data.publicUrl,
      file_name: img.file_name,
      file_path: img.file_path,
    })));
  };

  const handleOpenWalletDialog = (member: any) => {
    const firstNetwork = member.networks[0];
    setWalletDialogMember({ memberId: firstNetwork.member_id, networkId: firstNetwork.network_id, memberName: member.user_name });
    fetchWalletImages(member.networks.map((n: any) => n.member_id));
  };

  const handleWalletUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!walletDialogMember) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingWallet(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsUploadingWallet(false); return; }

    for (const file of files) {
      const ext = file.name.split('.').pop();
      const filePath = `wallet-images/${walletDialogMember.networkId}/${walletDialogMember.memberId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('settlebill-images').upload(filePath, file);
      if (uploadError) continue;
      await supabase.from('settlegara_member_wallet_images').insert({
        network_id: walletDialogMember.networkId,
        member_id: walletDialogMember.memberId,
        file_path: filePath,
        file_name: file.name,
        uploaded_by: user.id,
      });
    }
    toast.success('Wallet image(s) uploaded');
    if (walletDialogMember) {
      const memberData = members?.find(m => m.user_name === walletDialogMember.memberName);
      if (memberData) fetchWalletImages(memberData.networks.map(n => n.member_id));
    }
    setIsUploadingWallet(false);
    if (walletInputRef.current) walletInputRef.current.value = '';
  };

  const handleDeleteWalletImage = async (img: { id: string; file_path: string }) => {
    await supabase.storage.from('settlebill-images').remove([img.file_path]);
    await supabase.from('settlegara_member_wallet_images').delete().eq('id', img.id);
    if (walletDialogMember) {
      const memberData = members?.find(m => m.user_name === walletDialogMember.memberName);
      if (memberData) fetchWalletImages(memberData.networks.map(n => n.member_id));
    }
    toast.success('Wallet image deleted');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
        <div className="text-center py-8">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-red-700">All Members</h1>
          </div>
          
          <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Network Member</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              {!selectedNetworkId ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Select Network</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Choose a network to add members to.
                    </p>
                    <div className="space-y-2">
                      <Label>Network</Label>
                      <Select
                        value={selectedNetworkId}
                        onValueChange={handleNetworkSelect}
                        disabled={networksLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a network..." />
                        </SelectTrigger>
                        <SelectContent>
                          {networks?.map((network) => (
                            <SelectItem key={network.id} value={network.id}>
                              {network.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {networks?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No networks found. Create a network first to add members.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <AddMemberForm
                  networkId={selectedNetworkId}
                  networkName={selectedNetwork?.name || ''}
                  onClose={handleCloseAddMember}
                  onSuccess={handleCloseAddMember}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
        
        <p className="text-red-500">
          View all unique members across your networks and see which networks they belong to.
        </p>

        <Card className="bg-white/70 border border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Users className="w-5 h-5" />
              Members ({members?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members && members.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {members.map((member) => (
                  <div 
                    key={member.id} 
                    className="p-3 md:p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="flex-shrink-0">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_email}`} />
                        <AvatarFallback>{member.user_name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm md:text-base truncate">{member.user_name}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{member.user_email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 flex-shrink-0"
                        onClick={() => handleOpenWalletDialog(member)}
                        title="Manage wallet images"
                      >
                        <Wallet className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Networks this member belongs to */}
                    <div className="ml-12 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        Networks ({member.networks.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {member.networks.map((network) => (
                          <div 
                            key={network.network_id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-md text-xs group"
                          >
                            <Link 
                              to={`/settlebill/networks/${network.network_id}`}
                              className="flex items-center gap-1.5 hover:underline"
                            >
                              <span className="font-medium">{network.network_name}</span>
                              <Badge 
                                variant={network.role === 'admin' ? 'default' : 'secondary'} 
                                className="text-[10px] px-1.5 py-0"
                              >
                                {network.role}
                              </Badge>
                              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 ml-1"
                              onClick={() => handleEditMember(member, network)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm md:text-base">No members found. Create a network and add members to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editingMember?.user_name || ''}
                onChange={(e) => setEditingMember(prev => prev ? { ...prev, user_name: e.target.value } : null)}
                placeholder="Member name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingMember?.user_email || ''}
                onChange={(e) => setEditingMember(prev => prev ? { ...prev, user_email: e.target.value } : null)}
                placeholder="Member email"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSaveEdit} 
                disabled={updateMemberMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMemberMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={updateMemberMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Images Dialog */}
      <Dialog open={!!walletDialogMember} onOpenChange={() => setWalletDialogMember(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Wallet Images - {walletDialogMember?.memberName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              size="sm"
              onClick={() => walletInputRef.current?.click()}
              disabled={isUploadingWallet}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="w-4 h-4 mr-1" />
              {isUploadingWallet ? 'Uploading...' : 'Upload Image'}
            </Button>
            <input
              ref={walletInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleWalletUpload}
            />
            <div className="flex flex-wrap gap-2">
              {walletImages.map(img => (
                <div key={img.id} className="relative group">
                  <img src={img.url} alt={img.file_name} className="w-20 h-20 object-cover rounded-md border" />
                  <button
                    onClick={() => handleDeleteWalletImage(img)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {walletImages.length === 0 && (
                <p className="text-sm text-muted-foreground">No wallet images yet.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};