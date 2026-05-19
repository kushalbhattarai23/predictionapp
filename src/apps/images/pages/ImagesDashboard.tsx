import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUserImages, UserImage } from '@/hooks/useUserImages';
import { Upload, Heart, Trash2, Eye, EyeOff, Search, Filter, FolderPlus, Image as ImageIcon, Grid3X3, Tag, X, Edit2 } from 'lucide-react';

const ImagesDashboard: React.FC = () => {
  const { images, albums, isLoading, uploadImage, deleteImage, toggleFavorite, createAlbum, getImageUrl, updateImage } = useUserImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterAlbum, setFilterAlbum] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<UserImage | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAlbumDialog, setShowAlbumDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', description: '', albumId: '', tags: '', isPublic: false });
  const [albumData, setAlbumData] = useState({ name: '', description: '', isPublic: false });
  const [editData, setEditData] = useState({ title: '', description: '', tags: '', is_public: false, is_favorite: false });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const filteredImages = images.filter(img => {
    if (filterFavorites && !img.is_favorite) return false;
    if (filterAlbum !== 'all' && img.album_id !== filterAlbum) return false;
    if (search) {
      const s = search.toLowerCase();
      return (img.title?.toLowerCase().includes(s) || img.tags?.some(t => t.toLowerCase().includes(s)));
    }
    return true;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPendingFiles(files);
    setShowUploadDialog(true);
  };

  const handleUpload = async () => {
    for (const file of pendingFiles) {
      await uploadImage.mutateAsync({
        file,
        title: uploadData.title || undefined,
        description: uploadData.description || undefined,
        albumId: uploadData.albumId || undefined,
        tags: uploadData.tags ? uploadData.tags.split(',').map(t => t.trim()) : undefined,
        isPublic: uploadData.isPublic,
      });
    }
    setShowUploadDialog(false);
    setUploadData({ title: '', description: '', albumId: '', tags: '', isPublic: false });
    setPendingFiles([]);
  };

  const handleCreateAlbum = async () => {
    await createAlbum.mutateAsync(albumData);
    setShowAlbumDialog(false);
    setAlbumData({ name: '', description: '', isPublic: false });
  };

  const openEditDialog = (img: UserImage) => {
    setEditData({
      title: img.title || '',
      description: img.description || '',
      tags: img.tags?.join(', ') || '',
      is_public: img.is_public,
      is_favorite: img.is_favorite,
    });
    setSelectedImage(img);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedImage) return;
    await updateImage.mutateAsync({
      id: selectedImage.id,
      title: editData.title,
      description: editData.description,
      tags: editData.tags ? editData.tags.split(',').map(t => t.trim()) : [],
      is_public: editData.is_public,
      is_favorite: editData.is_favorite,
    });
    setShowEditDialog(false);
  };

  const stats = {
    total: images.length,
    favorites: images.filter(i => i.is_favorite).length,
    public: images.filter(i => i.is_public).length,
    albums: albums.length,
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-6"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Images</h1>
          <p className="text-muted-foreground">Your personal media gallery</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAlbumDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-2" /> New Album
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Images</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.favorites}</p><p className="text-xs text-muted-foreground">Favorites</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.public}</p><p className="text-xs text-muted-foreground">Public</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.albums}</p><p className="text-xs text-muted-foreground">Albums</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search images or tags..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterAlbum} onValueChange={setFilterAlbum}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All albums" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Albums</SelectItem>
            {albums.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={filterFavorites ? 'default' : 'outline'} size="icon" onClick={() => setFilterFavorites(!filterFavorites)}>
          <Heart className={`h-4 w-4 ${filterFavorites ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Albums */}
      {albums.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {albums.map(album => (
              <Card key={album.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterAlbum(album.id)}>
                <CardContent className="p-3 text-center">
                  <Grid3X3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium truncate">{album.name}</p>
                  <p className="text-xs text-muted-foreground">{images.filter(i => i.album_id === album.id).length} images</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Image Grid */}
      {filteredImages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No images yet</p>
            <p className="text-muted-foreground mb-4">Upload your first image to get started</p>
            <Button onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" /> Upload Image</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredImages.map(img => (
            <Card key={img.id} className="group relative overflow-hidden">
              <div className="aspect-square relative">
                <img src={getImageUrl(img.file_path)} alt={img.title || ''} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={() => toggleFavorite.mutate(img)}>
                      <Heart className={`h-4 w-4 ${img.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={() => openEditDialog(img)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={() => window.open(getImageUrl(img.file_path), '_blank')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={() => deleteImage.mutate(img)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {img.is_favorite && (
                  <Heart className="absolute top-2 right-2 h-4 w-4 fill-red-500 text-red-500" />
                )}
                {img.is_public && (
                  <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] px-1">Public</Badge>
                )}
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{img.title}</p>
                {img.tags && img.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {img.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload {pendingFiles.length} Image{pendingFiles.length > 1 ? 's' : ''}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={uploadData.title} onChange={e => setUploadData(d => ({ ...d, title: e.target.value }))} placeholder="Image title" /></div>
            <div><Label>Description</Label><Textarea value={uploadData.description} onChange={e => setUploadData(d => ({ ...d, description: e.target.value }))} placeholder="Description" /></div>
            <div><Label>Album</Label>
              <Select value={uploadData.albumId} onValueChange={v => setUploadData(d => ({ ...d, albumId: v }))}>
                <SelectTrigger><SelectValue placeholder="No album" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No album</SelectItem>
                  {albums.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Tags (comma-separated)</Label><Input value={uploadData.tags} onChange={e => setUploadData(d => ({ ...d, tags: e.target.value }))} placeholder="nature, vacation, family" /></div>
            <div className="flex items-center gap-2"><Switch checked={uploadData.isPublic} onCheckedChange={v => setUploadData(d => ({ ...d, isPublic: v }))} /><Label>Make public</Label></div>
            <Button onClick={handleUpload} disabled={uploadImage.isPending} className="w-full">
              {uploadImage.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Album Dialog */}
      <Dialog open={showAlbumDialog} onOpenChange={setShowAlbumDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Album</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={albumData.name} onChange={e => setAlbumData(d => ({ ...d, name: e.target.value }))} placeholder="Album name" /></div>
            <div><Label>Description</Label><Textarea value={albumData.description} onChange={e => setAlbumData(d => ({ ...d, description: e.target.value }))} placeholder="Description" /></div>
            <div className="flex items-center gap-2"><Switch checked={albumData.isPublic} onCheckedChange={v => setAlbumData(d => ({ ...d, isPublic: v }))} /><Label>Public album</Label></div>
            <Button onClick={handleCreateAlbum} disabled={!albumData.name || createAlbum.isPending} className="w-full">Create Album</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Image Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Image</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={editData.title} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={editData.description} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} /></div>
            <div><Label>Tags (comma-separated)</Label><Input value={editData.tags} onChange={e => setEditData(d => ({ ...d, tags: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={editData.is_public} onCheckedChange={v => setEditData(d => ({ ...d, is_public: v }))} /><Label>Public</Label></div>
            <div className="flex items-center gap-2"><Switch checked={editData.is_favorite} onCheckedChange={v => setEditData(d => ({ ...d, is_favorite: v }))} /><Label>Favorite</Label></div>
            <Button onClick={handleSaveEdit} disabled={updateImage.isPending} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImagesDashboard;
