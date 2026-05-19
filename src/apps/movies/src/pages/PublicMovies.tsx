
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Film, Search, Star, Loader2 } from 'lucide-react';
import { usePublicMovies } from '@/hooks/useMovies';
import { Link } from 'react-router-dom';

export const PublicMovies: React.FC = () => {
  const { data: movies = [], isLoading } = usePublicMovies();
  const [search, setSearch] = useState('');

  const filtered = movies.filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">Discover Movies</h1>
        <p className="text-muted-foreground">Browse the public movie catalog</p>
      </div>

      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search public movies..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No public movies found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(movie => (
            <Card key={movie.id} className="overflow-hidden hover:shadow-md transition-shadow border-blue-200 dark:border-blue-800">
              {movie.poster_url ? (
                <div className="aspect-[2/3] w-full overflow-hidden">
                  <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-2">{movie.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {movie.release_year && <span>{movie.release_year}</span>}
                  {movie.genre && <span>• {movie.genre}</span>}
                </div>
                {movie.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{movie.rating}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicMovies;
