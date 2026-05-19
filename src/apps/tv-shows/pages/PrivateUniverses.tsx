
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Globe, Lock, Calendar, User, Trash2 } from 'lucide-react';
import { useUniverses } from '@/hooks/useUniverses';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const PrivateUniverses: React.FC = () => {
  const { user } = useAuth();
  const { universes, isLoading, createUniverse, updateUniverse, deleteUniverse } = useUniverses();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false
  });

  const myUniverses = universes.filter(universe => universe.creator_id === user?.id);

  const handleUniverseClick = (universe: any) => {
    navigate(`/tv-shows/universe/${universe.slug || universe.id}`, {
      state: { from: 'private' }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUniverse.mutate(formData);
    setFormData({ name: '', description: '', is_public: false });
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this universe?')) {
      deleteUniverse.mutate(id);
    }
  };

  const handleTogglePublic = (universe: any) => {
    updateUniverse.mutate({
      id: universe.id,
      is_public: !universe.is_public
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">My Universes</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create and manage your TV show universes
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Universe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Universe</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                <Label htmlFor="public">Make this universe public</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Create Universe</Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {myUniverses.length === 0 ? (
        <Card className="border-blue-200">
          <CardContent className="text-center py-12">
            <Globe className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Universes Yet</h3>
            <p className="text-muted-foreground">
              Create your first universe to start organizing your TV shows!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {myUniverses.map((universe) => (
            <Card 
              key={universe.id} 
              className="border-blue-200 hover:shadow-lg transition-shadow group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle 
                    className="text-blue-700 text-lg break-words group-hover:text-blue-800 cursor-pointer"
                    onClick={() => handleUniverseClick(universe)}
                  >
                    {universe.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={universe.is_public ? "border-green-200 text-green-700" : "border-yellow-200 text-yellow-700"}>
                      {universe.is_public ? (
                        <>
                          <Globe className="w-3 h-3 mr-1" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          Private
                        </>
                      )}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(universe.id);
                      }}
                      className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {universe.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {universe.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`public-${universe.id}`}
                      checked={universe.is_public}
                      onCheckedChange={() => handleTogglePublic(universe)}
                    />
                    <Label htmlFor={`public-${universe.id}`} className="text-sm">
                      {universe.is_public ? 'Public' : 'Private'}
                    </Label>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    <span>You</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{new Date(universe.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrivateUniverses;
