import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface UserImage {
  id: string;
  user_id: string;
  album_id: string | null;
  title: string | null;
  description: string | null;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  tags: string[];
  is_favorite: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImageAlbum {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserImages = (albumId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const imagesQuery = useQuery({
    queryKey: ['user-images', user?.id, albumId],
    queryFn: async () => {
      let query = supabase
        .from('user_images')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (albumId) {
        query = query.eq('album_id', albumId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserImage[];
    },
    enabled: !!user,
  });

  const albumsQuery = useQuery({
    queryKey: ['image-albums', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('image_albums')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ImageAlbum[];
    },
    enabled: !!user,
  });

  const uploadImage = useMutation({
    mutationFn: async ({ file, title, description, albumId, tags, isPublic }: {
      file: File;
      title?: string;
      description?: string;
      albumId?: string;
      tags?: string[];
      isPublic?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('user_images')
        .insert({
          user_id: user.id,
          file_path: fileName,
          title: title || file.name.replace(/\.[^/.]+$/, ''),
          description,
          album_id: albumId || null,
          tags: tags || [],
          is_public: isPublic || false,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
      toast.success('Image uploaded successfully');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    },
  });

  const deleteImage = useMutation({
    mutationFn: async (image: UserImage) => {
      await supabase.storage.from('user-images').remove([image.file_path]);
      const { error } = await supabase.from('user_images').delete().eq('id', image.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
      toast.success('Image deleted');
    },
    onError: () => toast.error('Failed to delete image'),
  });

  const updateImage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserImage> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_images')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
      toast.success('Image updated');
    },
    onError: () => toast.error('Failed to update image'),
  });

  const toggleFavorite = useMutation({
    mutationFn: async (image: UserImage) => {
      const { error } = await supabase
        .from('user_images')
        .update({ is_favorite: !image.is_favorite })
        .eq('id', image.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-images'] }),
  });

  const createAlbum = useMutation({
    mutationFn: async ({ name, description, isPublic }: { name: string; description?: string; isPublic?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('image_albums')
        .insert({ user_id: user.id, name, description, is_public: isPublic || false })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-albums'] });
      toast.success('Album created');
    },
    onError: () => toast.error('Failed to create album'),
  });

  const deleteAlbum = useMutation({
    mutationFn: async (albumId: string) => {
      const { error } = await supabase.from('image_albums').delete().eq('id', albumId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-albums'] });
      toast.success('Album deleted');
    },
    onError: () => toast.error('Failed to delete album'),
  });

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage.from('user-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  return {
    images: imagesQuery.data || [],
    albums: albumsQuery.data || [],
    isLoading: imagesQuery.isLoading || albumsQuery.isLoading,
    uploadImage,
    deleteImage,
    updateImage,
    toggleFavorite,
    createAlbum,
    deleteAlbum,
    getImageUrl,
  };
};
