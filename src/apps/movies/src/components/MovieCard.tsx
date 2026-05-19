
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Film, Star, Heart, Eye, Clock, XCircle } from 'lucide-react';
import type { Movie } from '@/hooks/useMovies';

interface MovieCardProps {
  movie: Movie;
  onMarkWatched?: (id: string) => void;
  onToggleFavorite?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'watched': return { label: 'Watched', icon: Eye, className: 'bg-green-500 text-white border-0' };
    case 'watching': return { label: 'Watching', icon: Eye, className: 'bg-blue-500 text-white border-0' };
    case 'want_to_watch': return { label: 'Watchlist', icon: Clock, className: 'bg-amber-500 text-white border-0' };
    case 'dropped': return { label: 'Dropped', icon: XCircle, className: 'bg-red-500 text-white border-0' };
    default: return { label: status, icon: Clock, className: 'bg-muted text-muted-foreground' };
  }
};

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onMarkWatched, onToggleFavorite, onDelete, showActions = true }) => {
  const statusConfig = getStatusConfig(movie.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="h-full transition-all hover:shadow-md overflow-hidden border-blue-200 dark:border-blue-800">
      <Link to={`/movies/detail/${movie.id}`}>
        {movie.poster_url ? (
          <div className="aspect-[2/3] w-full overflow-hidden">
            <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center">
            <Film className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </Link>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-blue-700 dark:text-blue-300 break-words line-clamp-2">{movie.title}</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          {movie.release_year && <span className="text-xs text-muted-foreground">{movie.release_year}</span>}
          {movie.genre && <span className="text-xs text-muted-foreground">• {movie.genre}</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className={`${statusConfig.className} flex items-center gap-1 text-xs`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </Badge>
          {movie.user_rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{movie.user_rating}/10</span>
            </div>
          )}
        </div>
        
        {movie.is_favorite && (
          <div className="flex items-center gap-1 text-red-500 text-xs">
            <Heart className="w-3 h-3 fill-current" /> Favorite
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 pt-1">
            {movie.status !== 'watched' && onMarkWatched && (
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.preventDefault(); onMarkWatched(movie.id); }}>
                <Eye className="w-3 h-3 mr-1" /> Watched
              </Button>
            )}
            <Link to={`/movies/detail/${movie.id}`} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full text-xs">View</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MovieCard;
