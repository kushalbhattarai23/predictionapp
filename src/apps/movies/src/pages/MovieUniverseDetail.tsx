
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Film, Plus, Trash2, Loader2, Globe, Lock, GripVertical, Eye, EyeOff, Star, Clock, BarChart3, Calendar } from 'lucide-react';
import { useMovieUniverses, useMovieUniverseItems } from '@/hooks/useMovieUniverses';
import { useMovies, useUpdateMovie } from '@/hooks/useMovies';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  watched: 'hsl(142, 71%, 45%)',
  watching: 'hsl(217, 91%, 60%)',
  want_to_watch: 'hsl(45, 93%, 47%)',
  dropped: 'hsl(0, 84%, 60%)',
};

const STATUS_LABELS: Record<string, string> = {
  watched: 'Watched',
  watching: 'Watching',
  want_to_watch: 'Watchlist',
  dropped: 'Dropped',
};

export const MovieUniverseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { universes } = useMovieUniverses();
  const { items, isLoading, addMovie, removeMovie, updateOrder } = useMovieUniverseItems(id);
  const { data: movies = [] } = useMovies();
  const updateMovie = useUpdateMovie();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);

  const universe = universes.find(u => u.id === id);
  const availableMovies = movies.filter(m => !items.some(item => item.movie_id === m.id));

  const toggleMovieSelection = (movieId: string) => {
    setSelectedMovieIds(prev =>
      prev.includes(movieId) ? prev.filter(id => id !== movieId) : [...prev, movieId]
    );
  };

  const handleAddMovies = () => {
    if (selectedMovieIds.length === 0) return;
    selectedMovieIds.forEach((movieId, i) => {
      addMovie.mutate({ movieId, timelineOrder: items.length + i });
    });
    setSelectedMovieIds([]);
  };

  const handleToggleWatched = (movieId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'watched' ? 'want_to_watch' : 'watched';
    const watchedAt = newStatus === 'watched' ? new Date().toISOString().split('T')[0] : null;
    updateMovie.mutate(
      { id: movieId, status: newStatus, watched_at: watchedAt },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['movie-universe-items', id] });
          queryClient.invalidateQueries({ queryKey: ['movies'] });
          toast({ title: newStatus === 'watched' ? '✓ Marked as watched' : 'Moved to watchlist' });
        },
      }
    );
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  if (!universe) {
    return (
      <div className="text-center py-12">
        <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Universe Not Found</h1>
        <Link to="/movies/universes"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
      </div>
    );
  }

  // Analytics data
  const watchedCount = items.filter(item => item.movie?.status === 'watched').length;
  const progressPct = items.length > 0 ? Math.round((watchedCount / items.length) * 100) : 0;

  const statusData = Object.entries(
    items.reduce((acc, item) => {
      const s = item.movie?.status || 'unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value, fill: STATUS_COLORS[name] || 'hsl(var(--muted))' }));

  const genreData = Object.entries(
    items.reduce((acc, item) => {
      const g = item.movie?.genre || 'Unknown';
      g.split(',').forEach(genre => {
        const trimmed = genre.trim();
        if (trimmed) acc[trimmed] = (acc[trimmed] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const totalRuntime = items.reduce((sum, item) => {
    const movie = item.movie as any;
    return sum + (movie?.runtime_minutes || movie?.duration_minutes || 0);
  }, 0);

  const avgRating = (() => {
    const rated = items.filter(item => item.movie?.user_rating);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, item) => sum + (item.movie?.user_rating || 0), 0) / rated.length;
  })();

  const ratingDistribution = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    count: items.filter(item => item.movie?.user_rating === i + 1).length,
  })).filter(d => d.count > 0);

  return (
    <div className="space-y-6">
      <Link to="/movies/universes" className="flex items-center text-primary hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />Back to Universes
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{universe.name}</h1>
          {universe.description && <p className="text-muted-foreground">{universe.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{universe.is_public ? <><Globe className="w-3 h-3 mr-1" />Public</> : <><Lock className="w-3 h-3 mr-1" />Private</>}</Badge>
            <Badge variant="secondary">{items.length} movies</Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Watch Progress</span>
              <span className="font-medium">{watchedCount}/{items.length} ({progressPct}%)</span>
            </div>
            <Progress value={progressPct} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <Eye className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{watchedCount}</p>
              <p className="text-xs text-muted-foreground">Watched</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Film className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{items.length - watchedCount}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{totalRuntime > 0 ? `${Math.floor(totalRuntime / 60)}h ${totalRuntime % 60}m` : '—'}</p>
              <p className="text-xs text-muted-foreground">Total Runtime</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Star className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Charts */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statusData.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {genreData.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Genres</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={genreData.slice(0, 6)}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {ratingDistribution.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4" />Rating Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ratingDistribution}>
                    <XAxis dataKey="rating" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Movie */}
      {availableMovies.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Add Movies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
              {availableMovies.map(m => (
                <label key={m.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                  <Checkbox
                    checked={selectedMovieIds.includes(m.id)}
                    onCheckedChange={() => toggleMovieSelection(m.id)}
                  />
                  <span className="text-sm">{m.title} {m.release_year && `(${m.release_year})`}</span>
                </label>
              ))}
            </div>
            {selectedMovieIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{selectedMovieIds.length} movie(s) selected</p>
            )}
            <Button onClick={handleAddMovies} disabled={selectedMovieIds.length === 0 || addMovie.isPending} className="w-full">
              <Plus className="w-4 h-4 mr-1" />Add {selectedMovieIds.length > 0 ? `${selectedMovieIds.length} Movie(s)` : 'Movies'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No movies in this universe yet</p>
            <p className="text-muted-foreground">Add movies to build your timeline</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Timeline Order</h2>
          {items.map((item, index) => {
            const isWatched = item.movie?.status === 'watched';
            return (
              <Card key={item.id} className={isWatched ? 'border-green-300 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10' : ''}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-sm font-bold w-6">{index + 1}</span>
                  </div>
                  {item.movie?.poster_url ? (
                    <img src={item.movie.poster_url} alt="" className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-muted rounded flex items-center justify-center"><Film className="w-4 h-4" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link to={`/movies/detail/${item.movie_id}`} className="font-medium hover:underline text-foreground truncate block">
                      {item.movie?.title || 'Unknown Movie'}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.movie?.release_year && <span>{item.movie.release_year}</span>}
                      {item.movie?.genre && <span>• {item.movie.genre}</span>}
                      {item.movie?.user_rating && <span>• ⭐ {item.movie.user_rating}/10</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isWatched ? 'default' : 'outline'}
                    className="shrink-0"
                    onClick={() => handleToggleWatched(item.movie_id, item.movie?.status || 'want_to_watch')}
                    disabled={updateMovie.isPending}
                  >
                    {isWatched ? <><Eye className="w-3 h-3 mr-1" />Watched</> : <><EyeOff className="w-3 h-3 mr-1" />Watch</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeMovie.mutate(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MovieUniverseDetail;
