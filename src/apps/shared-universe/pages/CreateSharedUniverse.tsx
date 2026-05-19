import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useSharedUniverses } from '@/hooks/useSharedUniverses';

export const CreateSharedUniverse: React.FC = () => {
  const navigate = useNavigate();
  const { createUniverse } = useSharedUniverses();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [coverImage, setCoverImage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createUniverse.mutate(
      { title: title.trim(), description: description.trim() || undefined, visibility, cover_image: coverImage.trim() || undefined },
      { onSuccess: (data) => navigate(`/shared-universe/${data.id}`) }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link to="/shared-universe" className="flex items-center text-primary hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />Back to Shared Universes
      </Link>

      <Card>
        <CardHeader><CardTitle>Create Shared Universe</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Marvel Cinematic Universe" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this universe timeline..." rows={3} />
            </div>
            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cover">Cover Image URL</Label>
              <Input id="cover" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..." />
            </div>
            <Button type="submit" disabled={!title.trim() || createUniverse.isPending} className="w-full">
              {createUniverse.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Universe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSharedUniverse;
