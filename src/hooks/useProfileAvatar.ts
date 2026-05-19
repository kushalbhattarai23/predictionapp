import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useProfileAvatar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) return null;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Remove old avatar if exists
      await supabase.storage.from('avatars').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: filePath,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile picture updated!');
      return filePath;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload profile picture');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading, getAvatarUrl };
};
