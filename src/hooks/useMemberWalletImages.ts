import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MemberWalletImage {
  id: string;
  network_id: string;
  member_id: string;
  file_path: string;
  file_name: string;
  uploaded_by: string | null;
  created_at: string;
  url: string;
  member_email?: string;
  member_name?: string;
}

export const useMemberWalletImages = (networkId: string, memberEmails?: string[]) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['member-wallet-images', networkId, memberEmails],
    queryFn: async (): Promise<MemberWalletImage[]> => {
      // First get images for this network
      const { data: localData, error: localError } = await supabase
        .from('settlegara_member_wallet_images')
        .select('*, settlegara_network_members!inner(user_email, user_name)')
        .eq('network_id', networkId)
        .order('created_at', { ascending: false });

      if (localError) throw localError;

      // Also fetch images from other networks for the same member emails
      let crossNetworkData: any[] = [];
      if (memberEmails && memberEmails.length > 0) {
        const { data: crossData, error: crossError } = await supabase
          .from('settlegara_member_wallet_images')
          .select('*, settlegara_network_members!inner(user_email, user_name)')
          .neq('network_id', networkId)
          .in('settlegara_network_members.user_email', memberEmails)
          .order('created_at', { ascending: false });

        if (!crossError && crossData) {
          crossNetworkData = crossData;
        }
      }

      const allData = [...(localData || []), ...crossNetworkData];
      
      // Deduplicate by file_path
      const seen = new Set<string>();
      const unique = allData.filter(img => {
        if (seen.has(img.file_path)) return false;
        seen.add(img.file_path);
        return true;
      });

      return unique.map((img: any) => ({
        id: img.id,
        network_id: img.network_id,
        member_id: img.member_id,
        file_path: img.file_path,
        file_name: img.file_name,
        uploaded_by: img.uploaded_by,
        created_at: img.created_at,
        url: supabase.storage.from('settlebill-images').getPublicUrl(img.file_path).data.publicUrl,
        member_email: img.settlegara_network_members?.user_email,
        member_name: img.settlegara_network_members?.user_name,
      }));
    },
    enabled: !!networkId,
  });

  const uploadWalletImage = useMutation({
    mutationFn: async ({ file, memberId, networkId: nId }: { file: File; memberId: string; networkId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop();
      const filePath = `wallet-images/${nId}/${memberId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('settlebill-images')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error } = await supabase
        .from('settlegara_member_wallet_images')
        .insert({
          network_id: nId,
          member_id: memberId,
          file_path: filePath,
          file_name: file.name,
          uploaded_by: user.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-wallet-images', networkId] });
      toast.success('Wallet image uploaded');
    },
    onError: () => toast.error('Failed to upload wallet image'),
  });

  const deleteWalletImage = useMutation({
    mutationFn: async (image: MemberWalletImage) => {
      await supabase.storage.from('settlebill-images').remove([image.file_path]);
      const { error } = await supabase.from('settlegara_member_wallet_images').delete().eq('id', image.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-wallet-images', networkId] });
      toast.success('Wallet image deleted');
    },
    onError: () => toast.error('Failed to delete wallet image'),
  });

  return {
    walletImages: query.data || [],
    isLoading: query.isLoading,
    uploadWalletImage,
    deleteWalletImage,
  };
};
