
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Plus, Edit, Trash2, Film, Loader2, Lock, Eye } from 'lucide-react';
import { useMovieUniverses } from '@/hooks/useMovieUniverses';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePublicMovieUniverses } from '@/hooks/useMovieUniverses';

export const MovieUniverses: React.FC = () => {
  const { universes, isLoading, createUniverse, updateUniverse, deleteUniverse } = useMovieUniverses();
  const { data: publicUniverses = [] } = usePublicMovieUniverses();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    createUniverse.mutate({ name, description, is_public: isPublic }, {
      onSuccess: () => { setIsCreateOpen(false); resetForm(); },
    });
  };

  const handleUpdate = () => {
    if (!editingId || !name.trim()) return;
    updateUniverse.mutate({ id: editingId, name, description, is_public: isPublic }, {
      onSuccess: () => { setEditingId(null); resetForm(); },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this universe and all its movie links?')) {
      deleteUniverse.mutate(id);
    }
  };

  const resetForm = () => { setName(''); setDescription(''); setIsPublic(false); };

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setName(u.name);
    setDescription(u.description || '');
    setIsPublic(u.is_public);
  };

  const UniverseForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Marvel Cinematic Universe" /></div>
      <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this movie universe..." rows={3} /></div>
      <div className="flex items-center gap-3"><Switch checked={isPublic} onCheckedChange={setIsPublic} /><Label>Make Public</Label></div>
      <Button onClick={onSubmit} className="w-full" disabled={!name.trim()}>{submitLabel}</Button>
    </div>
  );

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">Movie Universes</h1>
          <p className="text-muted-foreground">Organize movies into franchise timelines</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />New Universe</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Movie Universe</DialogTitle></DialogHeader>
            <UniverseForm onSubmit={handleCreate} submitLabel="Create Universe" />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my-universes">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-universes">My Universes</TabsTrigger>
          <TabsTrigger value="public">Public Universes</TabsTrigger>
        </TabsList>

        <TabsContent value="my-universes" className="space-y-4 mt-4">
          {universes.length === 0 ? (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="text-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No universes yet</p>
                <p className="text-muted-foreground mb-4">Create your first movie universe</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {universes.map(u => (
                <Card key={u.id} className="border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <Link to={`/movies/universes/${u.id}`}>
                        <CardTitle className="text-lg text-blue-700 dark:text-blue-300 hover:underline">{u.name}</CardTitle>
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {u.is_public ? <><Globe className="w-3 h-3 mr-1" />Public</> : <><Lock className="w-3 h-3 mr-1" />Private</>}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {u.description && <p className="text-sm text-muted-foreground line-clamp-2">{u.description}</p>}
                    <div className="flex gap-2">
                      <Link to={`/movies/universes/${u.id}`} className="flex-1"><Button size="sm" variant="secondary" className="w-full">View</Button></Link>
                      <Dialog open={editingId === u.id} onOpenChange={(o) => { if (!o) { setEditingId(null); resetForm(); } }}>
                        <DialogTrigger asChild><Button size="sm" variant="outline" onClick={() => startEdit(u)}><Edit className="w-3 h-3" /></Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Edit Universe</DialogTitle></DialogHeader>
                          <UniverseForm onSubmit={handleUpdate} submitLabel="Update" />
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public" className="space-y-4 mt-4">
          {publicUniverses.length === 0 ? (
            <Card><CardContent className="text-center py-12"><p className="text-muted-foreground">No public movie universes yet</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicUniverses.map(u => (
                <Card key={u.id} className="border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{u.name}</CardTitle>
                      <Badge variant="outline" className="text-xs"><Globe className="w-3 h-3 mr-1" />Public</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {u.description && <p className="text-sm text-muted-foreground line-clamp-2">{u.description}</p>}
                    <Link to={`/movies/universes/${u.id}`}>
                      <Button size="sm" variant="secondary" className="w-full"><Eye className="w-3 h-3 mr-2" />View Universe</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MovieUniverses;
