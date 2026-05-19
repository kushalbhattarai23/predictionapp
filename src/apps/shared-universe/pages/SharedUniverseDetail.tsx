import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Film, Tv, Plus, Trash2, Loader2, Globe, Lock, GripVertical, Eye, EyeOff, Star, Clock, BarChart3, Search } from 'lucide-react';
import { useSharedUniverses, useSharedUniverseMedia } from '@/hooks/useSharedUniverses';
import { useMovies, useUpdateMovie } from '@/hooks/useMovies';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

const STATUS_COLORS: Record<string, string> = {
  watched: 'hsl(142, 71%, 45%)',
  watching: 'hsl(217, 91%, 60%)',
  want_to_watch: 'hsl(45, 93%, 47%)',
  dropped: 'hsl(0, 84%, 60%)',
};

export const SharedUniverseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { universes } = useSharedUniverses();
  const { mediaItems, isLoading, addMedia, removeMedia } = useSharedUniverseMedia(id);
  const { data: movies = [] } = useMovies();
  const updateMovie = useUpdateMovie();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'movie' | 'tv_show'>('movie');
  const [searchTerm, setSearchTerm] = useState('');
  const [phase, setPhase] = useState('');

  // Fetch user's shows
  const { data: userShows = [] } = useQuery({
    queryKey: ['user-shows-for-shared', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('shows')
        .select('id, title, poster_url, description, is_public')
        .order('title');
      return data || [];
    },
    enabled: !!user,
  });

  const universe = universes.find(u => u.id === id);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  if (!universe) {
    return (
      <div className="text-center py-12">
        <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Universe Not Found</h1>
        <Link to="/shared-universe"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
      </div>
    );
  }

  // Already added media ids
  const addedMovieIds = new Set(mediaItems.filter(m => m.media_type === 'movie').map(m => m.media_id));
  const addedShowIds = new Set(mediaItems.filter(m => m.media_type === 'tv_show').map(m => m.media_id));

  const availableMovies = movies.filter(m => !addedMovieIds.has(m.id) && m.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const availableShows = userShows.filter((s: any) => !addedShowIds.has(s.id) && s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddMedia = (mediaId: string, mediaType: 'movie' | 'tv_show') => {
    addMedia.mutate(
      { media_type: mediaType, media_id: mediaId, timeline_order: mediaItems.length, phase: phase || undefined },
      { onSuccess: () => { setIsPickerOpen(false); setSearchTerm(''); setPhase(''); } }
    );
  };

  const handleToggleMovieWatched = (movieId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'watched' ? 'want_to_watch' : 'watched';
    updateMovie.mutate(
      { id: movieId, status: newStatus, watched_at: newStatus === 'watched' ? new Date().toISOString().split('T')[0] : null },
      { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shared-universe-media', id] }); } }
    );
  };

  // Analytics
  const movieCount = mediaItems.filter(m => m.media_type === 'movie').length;
  const showCount = mediaItems.filter(m => m.media_type === 'tv_show').length;
  const watchedMovies = mediaItems.filter(m => m.media_type === 'movie' && m.movie?.status === 'watched').length;
  const progressPct = mediaItems.length > 0 ? Math.round((watchedMovies / mediaItems.length) * 100) : 0;

  const typeDistribution = [
    { name: 'Movies', value: movieCount, fill: 'hsl(217, 91%, 60%)' },
    { name: 'TV Shows', value: showCount, fill: 'hsl(142, 71%, 45%)' },
  ].filter(d => d.value > 0);

  const statusData = Object.entries(
    mediaItems.reduce((acc, item) => {
      const s = item.media_type === 'movie' ? (item.movie?.status || 'unknown') : 'tv_show';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name === 'want_to_watch' ? 'Watchlist' : name === 'watched' ? 'Watched' : name === 'tv_show' ? 'TV Show' : name,
    value,
    fill: STATUS_COLORS[name] || 'hsl(var(--muted))',
  }));

  // Group by phase
  const phases = new Map<string, typeof mediaItems>();
  mediaItems.forEach(item => {
    const p = item.phase || 'No Phase';
    if (!phases.has(p)) phases.set(p, []);
    phases.get(p)!.push(item);
  });

  return (
    <div className="space-y-6">
      <Link to="/shared-universe" className="flex items-center text-primary hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />Back to Shared Universes
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{universe.title}</h1>
          {universe.description && <p className="text-muted-foreground">{universe.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {universe.visibility === 'public' ? <><Globe className="w-3 h-3 mr-1" />Public</> : <><Lock className="w-3 h-3 mr-1" />Private</>}
            </Badge>
            <Badge variant="secondary">{movieCount} movies</Badge>
            <Badge variant="secondary">{showCount} shows</Badge>
          </div>
        </div>
        <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Media</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Media to Universe</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Input placeholder="Phase (optional)" value={phase} onChange={e => setPhase(e.target.value)} className="w-40" />
              </div>
              <Tabs value={pickerTab} onValueChange={(v) => setPickerTab(v as 'movie' | 'tv_show')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="movie"><Film className="w-3 h-3 mr-1" />Movies</TabsTrigger>
                  <TabsTrigger value="tv_show"><Tv className="w-3 h-3 mr-1" />TV Shows</TabsTrigger>
                </TabsList>
                <TabsContent value="movie" className="space-y-2 max-h-60 overflow-y-auto">
                  {availableMovies.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No movies available</p>}
                  {availableMovies.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer" onClick={() => handleAddMedia(m.id, 'movie')}>
                      {m.poster_url ? <img src={m.poster_url} alt="" className="w-8 h-12 object-cover rounded" /> : <div className="w-8 h-12 bg-muted rounded flex items-center justify-center"><Film className="w-3 h-3" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.release_year} • {m.genre || 'No genre'}</p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="tv_show" className="space-y-2 max-h-60 overflow-y-auto">
                  {availableShows.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No shows available</p>}
                  {availableShows.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer" onClick={() => handleAddMedia(s.id, 'tv_show')}>
                      {s.poster_url ? <img src={s.poster_url} alt="" className="w-8 h-12 object-cover rounded" /> : <div className="w-8 h-12 bg-muted rounded flex items-center justify-center"><Tv className="w-3 h-3" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress */}
      {mediaItems.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Watch Progress</span>
              <span className="font-medium">{watchedMovies}/{mediaItems.length} ({progressPct}%)</span>
            </div>
            <Progress value={progressPct} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {mediaItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4 text-center"><Film className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{movieCount}</p><p className="text-xs text-muted-foreground">Movies</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><Tv className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{showCount}</p><p className="text-xs text-muted-foreground">TV Shows</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><Eye className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{watchedMovies}</p><p className="text-xs text-muted-foreground">Watched</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><Star className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{mediaItems.length - watchedMovies}</p><p className="text-xs text-muted-foreground">Remaining</p></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4 mt-4">
          {mediaItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No media in this universe yet</p>
                <p className="text-muted-foreground">Add movies and TV shows to build your timeline</p>
              </CardContent>
            </Card>
          ) : (
            Array.from(phases.entries()).map(([phaseName, items]) => (
              <div key={phaseName} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{phaseName}</h3>
                {items.map((item, index) => {
                  const isMovie = item.media_type === 'movie';
                  const title = isMovie ? item.movie?.title : item.show?.title;
                  const poster = isMovie ? item.movie?.poster_url : item.show?.poster_url;
                  const isWatched = isMovie && item.movie?.status === 'watched';

                  return (
                    <Card key={item.id} className={isWatched ? 'border-green-300 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10' : ''}>
                      <CardContent className="flex items-center gap-3 py-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GripVertical className="w-4 h-4" />
                          <span className="text-sm font-bold w-6">{item.timeline_order + 1}</span>
                        </div>
                        {poster ? (
                          <img src={poster} alt="" className="w-10 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                            {isMovie ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {isMovie ? <><Film className="w-2.5 h-2.5 mr-0.5" />Movie</> : <><Tv className="w-2.5 h-2.5 mr-0.5" />Show</>}
                            </Badge>
                            {item.phase && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.phase}</Badge>}
                          </div>
                          <p className="font-medium truncate mt-0.5">{title || 'Unknown'}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {isMovie && item.movie?.release_year && <span>{item.movie.release_year}</span>}
                            {isMovie && item.movie?.genre && <span>• {item.movie.genre}</span>}
                            {isMovie && item.movie?.user_rating && <span>• ⭐ {item.movie.user_rating}/10</span>}
                          </div>
                        </div>
                        {isMovie && (
                          <Button
                            size="sm"
                            variant={isWatched ? 'default' : 'outline'}
                            className="shrink-0"
                            onClick={() => handleToggleMovieWatched(item.media_id, item.movie?.status || 'want_to_watch')}
                            disabled={updateMovie.isPending}
                          >
                            {isWatched ? <><Eye className="w-3 h-3 mr-1" />Watched</> : <><EyeOff className="w-3 h-3 mr-1" />Watch</>}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => removeMedia.mutate(item.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          {mediaItems.length === 0 ? (
            <Card><CardContent className="text-center py-8 text-muted-foreground">Add media to see analytics</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typeDistribution.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Media Type Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                          {typeDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
              {statusData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Status Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={statusData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SharedUniverseDetail;
