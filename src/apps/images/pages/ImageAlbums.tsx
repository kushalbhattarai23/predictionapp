import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useUserImages } from '@/hooks/useUserImages';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Grid3X3, Trash2, Globe, Lock } from 'lucide-react';

const ImageAlbums: React.FC = () => {
  const { albums, images, createAlbum, deleteAlbum, getImageUrl } = useUserImages();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isPublic: false });

  const handleCreate = async () => {
    await createAlbum.mutateAsync(form);
    setShowDialog(false);
    setForm({ name: '', description: '', isPublic: false });
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Albums</h1>
          <p className="text-muted-foreground">{albums.length} albums</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <FolderPlus className="h-4 w-4 mr-2" /> New Album
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {albums.map(album => {
          const albumImages = images.filter(i => i.album_id === album.id);
          const coverImage = albumImages[0];
          return (
            <Card key={album.id} className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden" onClick={() => navigate(`/images?album=${album.id}`)}>
              <div className="aspect-video relative bg-muted">
                {coverImage ? (
                  <img src={getImageUrl(coverImage.file_path)} alt={album.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><Grid3X3 className="h-12 w-12 text-muted-foreground" /></div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {album.is_public ? <Globe className="h-4 w-4 text-white drop-shadow" /> : <Lock className="h-4 w-4 text-white drop-shadow" />}
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-medium truncate">{album.name}</p>
                <p className="text-xs text-muted-foreground">{albumImages.length} images</p>
                {album.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{album.description}</p>}
                <Button variant="ghost" size="icon" className="h-6 w-6 mt-1 opacity-0 group-hover:opacity-100" onClick={e => { e.stopPropagation(); deleteAlbum.mutate(album.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {albums.length === 0 && (
        <Card><CardContent className="p-12 text-center">
          <Grid3X3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">No albums yet</p>
          <p className="text-muted-foreground mb-4">Create your first album to organize images</p>
          <Button onClick={() => setShowDialog(true)}><FolderPlus className="h-4 w-4 mr-2" /> Create Album</Button>
        </CardContent></Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Album</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.isPublic} onCheckedChange={v => setForm(f => ({ ...f, isPublic: v }))} /><Label>Public</Label></div>
            <Button onClick={handleCreate} disabled={!form.name} className="w-full">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageAlbums;
