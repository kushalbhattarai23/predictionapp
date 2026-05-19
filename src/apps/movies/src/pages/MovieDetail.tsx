
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Film, Eye, EyeOff, Star, Heart, Clock, Edit, Trash2, Loader2, Globe } from 'lucide-react';
import { useMovie, useUpdateMovie, useDeleteMovie } from '@/hooks/useMovies';
import { useMovieUniverses } from '@/hooks/useMovieUniverses';
import { MovieForm } from '../components/MovieForm';
import { RatingInput } from '../components/RatingInput';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Hook to fetch universes a movie belongs to
const useMovieUniverseMemberships = (movieId: string | undefined) => {
  return useQuery({
    queryKey: ['movie-universe-memberships', movieId],
    queryFn: async () => {
      if (!movieId) return [];
      const { data, error } = await supabase
        .from('movie_universe_items')
        .select('*, universe:movie_universes(*)')
        .eq('movie_id', movieId);
      if (error) throw error;
      return data as Array<{
        id: string;
        universe_id: string;
        timeline_order: number;
        universe: { id: string; name: string; slug: string | null; is_public: boolean };
      }>;
    },
    enabled: !!movieId,
  });
};

export const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: movie, isLoading } = useMovie(id);
  const updateMovie = useUpdateMovie();
  const deleteMovie = useDeleteMovie();
  const { universes } = useMovieUniverses();
  const { data: memberships = [] } = useMovieUniverseMemberships(id);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState('');

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!movie) {
    return (
      <div className="text-center py-12">
        <Film className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
        <Link to="/movies/my-movies"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back to Movies</Button></Link>
      </div>
    );
  }

  const handleUpdate = (values: any) => {
    updateMovie.mutate({ id: movie.id, ...values }, {
      onSuccess: () => { setIsEditOpen(false); toast({ title: 'Movie updated' }); },
    });
  };

  const handleDelete = () => {
    if (confirm('Delete this movie?')) {
      deleteMovie.mutate(movie.id, { onSuccess: () => navigate('/movies/my-movies') });
    }
  };

  const handleToggleWatched = () => {
    if (movie.status === 'watched') {
      updateMovie.mutate({ id: movie.id, status: 'want_to_watch', watched_at: null });
    } else {
      updateMovie.mutate({ id: movie.id, status: 'watched', watched_at: new Date().toISOString() });
    }
  };

  const handleToggleFavorite = () => {
    updateMovie.mutate({ id: movie.id, is_favorite: !movie.is_favorite });
  };

  const handleRatingChange = (rating: number) => {
    updateMovie.mutate({ id: movie.id, user_rating: rating });
  };

  const handleAddToUniverse = async () => {
    if (!selectedUniverse || !id) return;
    const { error } = await supabase
      .from('movie_universe_items')
      .insert({ universe_id: selectedUniverse, movie_id: id, timeline_order: 0 });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Added to universe' });
      queryClient.invalidateQueries({ queryKey: ['movie-universe-memberships', id] });
      queryClient.invalidateQueries({ queryKey: ['movie-universe-items'] });
      setSelectedUniverse('');
    }
  };

  // Filter out universes the movie is already in
  const availableUniverses = universes.filter(u => !memberships.some(m => m.universe_id === u.id));

  return (
    <div className="space-y-6">
      <Link to="/movies/my-movies" className="flex items-center text-primary hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />Back to My Movies
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Poster */}
        <div className="lg:w-1/3 xl:w-1/4">
          <Card className="overflow-hidden">
            {movie.poster_url ? (
              <div className="aspect-[2/3] w-full">
                <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center">
                <Film className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            <CardContent className="p-4 space-y-3">
              <h1 className="text-2xl font-bold">{movie.title}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{movie.status === 'want_to_watch' ? 'Watchlist' : movie.status === 'watched' ? 'Watched' : movie.status}</Badge>
                {movie.is_favorite && <Badge className="bg-red-500 text-white border-0"><Heart className="w-3 h-3 mr-1 fill-current" />Favorite</Badge>}
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                {movie.release_year && <p>Year: {movie.release_year}</p>}
                {movie.genre && <p>Genre: {movie.genre}</p>}
                {movie.director && <p>Director: {movie.director}</p>}
                {movie.duration_minutes && <p>Duration: {movie.duration_minutes} min</p>}
                {movie.rewatch_count > 0 && <p>Rewatches: {movie.rewatch_count}</p>}
                {movie.watched_at && <p>Watched: {new Date(movie.watched_at).toLocaleDateString()}</p>}
              </div>

              <div className="space-y-2">
                <Button onClick={handleToggleWatched} variant={movie.status === 'watched' ? 'default' : 'outline'} className="w-full">
                  {movie.status === 'watched' ? <><EyeOff className="w-4 h-4 mr-2" />Unmark Watched</> : <><Eye className="w-4 h-4 mr-2" />Mark Watched</>}
                </Button>
                <Button onClick={handleToggleFavorite} variant="outline" className="w-full">
                  <Heart className={`w-4 h-4 mr-2 ${movie.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                  {movie.is_favorite ? 'Unfavorite' : 'Favorite'}
                </Button>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild><Button variant="outline" className="w-full"><Edit className="w-4 h-4 mr-2" />Edit</Button></DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Edit Movie</DialogTitle></DialogHeader>
                    <MovieForm
                      defaultValues={{
                        title: movie.title,
                        description: movie.description || '',
                        genre: movie.genre || '',
                        release_year: movie.release_year || undefined,
                        director: movie.director || '',
                        duration_minutes: movie.duration_minutes || undefined,
                        poster_url: movie.poster_url || '',
                        status: movie.status,
                        user_rating: movie.user_rating || undefined,
                        user_notes: movie.user_notes || '',
                        is_favorite: movie.is_favorite,
                      }}
                      onSubmit={handleUpdate}
                      isSubmitting={updateMovie.isPending}
                      submitLabel="Update Movie"
                    />
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" onClick={handleDelete} className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Your Rating</CardTitle></CardHeader>
            <CardContent>
              <RatingInput value={movie.user_rating} onChange={handleRatingChange} />
            </CardContent>
          </Card>

          {(movie.description || movie.overview) && (
            <Card>
              <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{movie.overview || movie.description}</p>
              </CardContent>
            </Card>
          )}

          {movie.user_notes && (
            <Card>
              <CardHeader><CardTitle>Personal Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{movie.user_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Universe Memberships */}
          {memberships.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />Part of Universes</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {memberships.map(m => (
                    <Link key={m.id} to={`/movies/universes/${m.universe_id}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-accent text-sm py-1 px-3">
                        <Globe className="w-3 h-3 mr-1" />
                        {m.universe?.name || 'Unknown Universe'}
                        <span className="ml-1 text-muted-foreground text-xs">#{m.timeline_order + 1}</span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add to Universe */}
          {availableUniverses.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />Add to Universe</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                <Select value={selectedUniverse} onValueChange={setSelectedUniverse}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select universe" /></SelectTrigger>
                  <SelectContent>
                    {availableUniverses.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddToUniverse} disabled={!selectedUniverse}>Add</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
