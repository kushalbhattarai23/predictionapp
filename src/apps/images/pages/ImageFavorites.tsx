import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserImages } from '@/hooks/useUserImages';
import { Heart, Eye, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';

const ImageFavorites: React.FC = () => {
  const { images, isLoading, toggleFavorite, deleteImage, getImageUrl } = useUserImages();
  const favorites = images.filter(i => i.is_favorite);

  if (isLoading) return <div className="container mx-auto px-4 py-6"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Favorites</h1>
        <p className="text-muted-foreground">{favorites.length} favorite images</p>
      </div>

      {favorites.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">No favorites yet</p>
          <p className="text-muted-foreground">Heart images to add them to your favorites</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {favorites.map(img => (
            <Card key={img.id} className="group relative overflow-hidden">
              <div className="aspect-square relative">
                <img src={getImageUrl(img.file_path)} alt={img.title || ''} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={() => toggleFavorite.mutate(img)}>
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={() => window.open(getImageUrl(img.file_path), '_blank')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={() => deleteImage.mutate(img)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{img.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageFavorites;
