import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Heart, HeartOff, CheckCircle, Calendar, Clock, Tv as TvIcon, ArrowLeft, Eye, EyeOff, ArrowUpDown, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ShowData {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  slug: string | null;
  created_at?: string;
  updated_at?: string;
  is_public?: boolean;
  // Optional fields that may exist
  tmdb_id?: string | null;
  status?: string | null;
  first_air_date?: string | null;
  last_air_date?: string | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  genres?: string[] | null;
}

interface EpisodeData {
  id: string;
  title: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  show_id: string;
  created_at?: string;
  updated_at?: string;
  is_watched: boolean;
}

interface EpisodesBySeasonMap {
  [key: number]: {
    episodes: EpisodeData[];
    watchedCount: number;
  };
}

export default function ShowDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [episodeSort, setEpisodeSort] = useState<string>("unwatched_first");
  
  console.log('ShowDetail: Route ID parameter:', id, 'pathname:', location.pathname);
  
  // Check if we're in tv-shows route vs public route
  const isTvShowsRoute = location.pathname.startsWith('/tv-shows');
  
  // Fetch show details using the ID
  const { data: show, isLoading: isLoadingShow, error: showError } = useQuery({
    queryKey: ['show', id, isTvShowsRoute],
    queryFn: async () => {
      if (!id) {
        console.error('ShowDetail: No ID provided');
        throw new Error('No show identifier provided');
      }
      
      console.log('ShowDetail: Fetching show with ID:', id, 'isTvShowsRoute:', isTvShowsRoute);
      
      let data, error;
      
      if (isTvShowsRoute) {
        // For tv-shows routes, search by multiple fields
        console.log('ShowDetail: Searching in tv-shows route');
        
        // First try to find by exact ID match if it looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(id)) {
          const result = await supabase
            .from('shows')
            .select('*')
            .eq('id', id)
            .single();
          data = result.data;
          error = result.error;
        } else {
          // If not a UUID, search by title, slug, or tmdb_id
          const result = await supabase
            .from('shows')
            .select('*')
            .or(`title.ilike.%${id}%,slug.eq.${id},tmdb_id.eq.${id}`)
            .single();
          data = result.data;
          error = result.error;
        }
      } else {
        // For public routes, use slug
        console.log('ShowDetail: Searching in public route');
        const result = await supabase
          .from('shows')
          .select('*')
          .eq('slug', id)
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('ShowDetail: Error fetching show:', error);
        throw error;
      }
      
      if (!data) {
        console.error('ShowDetail: No show found with ID:', id);
        throw new Error('Show not found');
      }
      
      console.log('ShowDetail: Found show:', data);
      return data;
    },
    enabled: !!id,
    retry: 1
  });
  
  // Fetch episodes data for this show
  const { data: episodesData = [], isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ['showEpisodes', show?.id],
    queryFn: async () => {
      if (!show?.id) return [];
      
      console.log('ShowDetail: Fetching episodes for show:', show.id);
      
      // Fetch episodes
      const { data: episodes, error: episodesError } = await supabase
        .from('episodes')
        .select('*')
        .eq('show_id', show.id)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true });
        
      if (episodesError) {
        console.error('ShowDetail: Error fetching episodes:', episodesError);
        throw episodesError;
      }
      
      console.log('ShowDetail: Found episodes:', episodes?.length || 0);
      
      let episodesWithStatus: EpisodeData[] = [];
      
      if (episodes && episodes.length > 0) {
        // Get watch status if user is logged in
        if (user) {
          const episodeIds = episodes.map(ep => ep.id);
          const watchedSet = new Set<string>();
          
          // Batch fetch watch status to avoid URL length limits for 1000+ episodes
          const batchSize = 200;
          for (let i = 0; i < episodeIds.length; i += batchSize) {
            const batch = episodeIds.slice(i, i + batchSize);
            const { data: statusData } = await supabase
              .from('user_episode_status')
              .select('episode_id, status')
              .eq('user_id', user.id)
              .eq('status', 'watched')
              .in('episode_id', batch);
            
            statusData?.forEach(s => watchedSet.add(s.episode_id));
          }
          
          episodesWithStatus = episodes.map(ep => ({
            ...ep,
            is_watched: watchedSet.has(ep.id)
          }));
        } else {
          episodesWithStatus = episodes.map(ep => ({
            ...ep,
            is_watched: false
          }));
        }
      }
      
      console.log('ShowDetail: Episodes with watch status:', episodesWithStatus.length);
      return episodesWithStatus;
    },
    enabled: !!show?.id
  });
  
  // Check if user is tracking this show
  const { data: isTracking = false } = useQuery({
    queryKey: ['isTrackingShow', show?.id, user?.id],
    queryFn: async () => {
      if (!user || !show?.id) return false;
      
      const { data, error } = await supabase
        .from('user_show_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('show_id', show.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('ShowDetail: Error checking tracking status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user && !!show?.id
  });

  // Track show mutation
  const { mutate: toggleTracking } = useMutation({
    mutationFn: async () => {
      if (!user || !show?.id) {
        throw new Error('You must be logged in to track shows');
      }
      
      if (isTracking) {
        const { error } = await supabase
          .from('user_show_tracking')
          .delete()
          .eq('user_id', user.id)
          .eq('show_id', show.id);
          
        if (error) throw error;
        return { isTracking: false };
      } else {
        const { error } = await supabase
          .from('user_show_tracking')
          .insert({ user_id: user.id, show_id: show.id });
          
        if (error) throw error;
        return { isTracking: true };
      }
    },
    onSuccess: (data) => {
      toast({
        title: data.isTracking ? 'Show added to your list' : 'Show removed from your list',
      });
      queryClient.invalidateQueries({ queryKey: ['isTrackingShow'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating tracking',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Toggle episode watch status
  const { mutate: toggleWatchStatus } = useMutation({
    mutationFn: async ({ episodeId, watched }: { episodeId: string, watched: boolean }) => {
      if (!user) {
        throw new Error('You must be logged in to track episodes');
      }
      
      const { error } = await supabase
        .from('user_episode_status')
        .upsert({ 
          user_id: user.id, 
          episode_id: episodeId, 
          status: watched ? 'watched' : 'not_watched',
          watched_at: watched ? new Date().toISOString() : null 
        }, { onConflict: 'user_id,episode_id' });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showEpisodes'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating episode status',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mark all episodes in a season as watched
  const { mutate: markSeasonWatched, isPending: isMarkingSeasonWatched } = useMutation({
    mutationFn: async (seasonNumber: number) => {
      if (!user || !episodesData) {
        throw new Error('You must be logged in to mark episodes');
      }

      const seasonEpisodes = episodesData.filter(ep => ep.season_number === seasonNumber && !ep.is_watched);
      
      const promises = seasonEpisodes.map(episode => {
        return supabase
          .from('user_episode_status')
          .upsert({ 
            user_id: user.id, 
            episode_id: episode.id, 
            status: 'watched',
            watched_at: new Date().toISOString()
          });
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: 'Season marked as watched' });
      queryClient.invalidateQueries({ queryKey: ['showEpisodes'] });
    }
  });

  // Mark all episodes as watched
  const { mutate: markAllWatched, isPending: isMarkingAllWatched } = useMutation({
    mutationFn: async () => {
      if (!user || !episodesData) {
        throw new Error('You must be logged in to mark episodes');
      }

      const unwatchedEpisodes = episodesData.filter(ep => !ep.is_watched);
      
      const promises = unwatchedEpisodes.map(episode => {
        return supabase
          .from('user_episode_status')
          .upsert({ 
            user_id: user.id, 
            episode_id: episode.id, 
            status: 'watched',
            watched_at: new Date().toISOString()
          });
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: 'All episodes marked as watched' });
      queryClient.invalidateQueries({ queryKey: ['showEpisodes'] });
    }
  });
  
  // Organize episodes by season
  const episodesBySeason: EpisodesBySeasonMap = {};
  
  if (episodesData) {
    episodesData.forEach(episode => {
      if (!episodesBySeason[episode.season_number]) {
        episodesBySeason[episode.season_number] = {
          episodes: [],
          watchedCount: 0
        };
      }
      
      episodesBySeason[episode.season_number].episodes.push(episode);
      
      if (episode.is_watched) {
        episodesBySeason[episode.season_number].watchedCount += 1;
      }
    });
  }

  // Sort seasons
  const sortedSeasons = Object.entries(episodesBySeason).sort(([a], [b]) => 
    parseInt(a) - parseInt(b)
  );
  
  // Calculate total progress
  const totalEpisodes = episodesData?.length || 0;
  const watchedEpisodes = episodesData?.filter(ep => ep.is_watched)?.length || 0;
  const progressPercentage = totalEpisodes > 0 
    ? Math.round((watchedEpisodes / totalEpisodes) * 100) 
    : 0;
  
  if (isLoadingShow) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  if (!show || showError) {
    console.error('ShowDetail: Show not found or error occurred:', { show, showError, id });
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <TvIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Show Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The show you're looking for could not be found. It may have been removed or the link is incorrect.
          </p>
          <Link to="/tv-shows">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to TV Shows
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/tv-shows" className="flex items-center text-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to TV Shows
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Show Poster/Details */}
          <div className="lg:w-1/3 xl:w-1/4">
            <Card className="overflow-hidden">
              {show.poster_url ? (
                <div className="aspect-[2/3] w-full">
                  <img 
                    src={show.poster_url} 
                    alt={show.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center">
                  <TvIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              
              <CardContent className="p-4 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{show.title}</h1>
                  <Badge variant="outline" className="mt-2">
                    {show.is_public ? 'Public' : 'Private'}
                  </Badge>
                </div>
                
                {/* Show Info */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Total Episodes in Database: {totalEpisodes}</div>
                  {sortedSeasons.length > 0 && (
                    <div>Seasons Available: {sortedSeasons.length}</div>
                  )}
                </div>
                
                {user && (
                  <>
                    <Button 
                      onClick={() => toggleTracking()} 
                      variant={isTracking ? "default" : "outline"}
                      className="w-full"
                    >
                      {isTracking ? (
                        <>
                          <HeartOff className="h-4 w-4 mr-2" />
                          Remove from My Shows
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-2" />
                          Add to My Shows
                        </>
                      )}
                    </Button>
                    
                    {isTracking && totalEpisodes > 0 && (
                      <Button 
                        onClick={() => markAllWatched()}
                        variant="outline"
                        className="w-full"
                        disabled={isMarkingAllWatched}
                      >
                        {isMarkingAllWatched ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Mark All Watched
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Show Content */}
          <div className="flex-1">
            <Tabs 
              defaultValue="overview" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="episodes">Episodes ({totalEpisodes})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                {/* Description */}
                {show.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{show.description}</p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Progress */}
                {user && isTracking && totalEpisodes > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Watched {watchedEpisodes} of {totalEpisodes} episodes</span>
                        <span>{progressPercentage}% complete</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </CardContent>
                  </Card>
                )}

                {/* Seasons Progress */}
                {user && isTracking && sortedSeasons.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Seasons Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sortedSeasons.map(([season, data]) => {
                        const seasonProgress = data.episodes.length > 0 
                          ? Math.round((data.watchedCount / data.episodes.length) * 100) 
                          : 0;
                        const isCompleted = data.watchedCount === data.episodes.length;
                        
                        return (
                          <div key={season} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Season {season}</span>
                                <Badge variant={isCompleted ? "default" : "outline"}>
                                  {data.watchedCount}/{data.episodes.length} episodes
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">{seasonProgress}%</span>
                            </div>
                            <Progress value={seasonProgress} className="h-2" />
                            {!isCompleted && (
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => markSeasonWatched(parseInt(season))}
                                className="w-full"
                                disabled={isMarkingSeasonWatched}
                              >
                                {isMarkingSeasonWatched ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Mark Season {season} Watched
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="episodes" className="space-y-6">
                {/* Sort Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={episodeSort} onValueChange={setEpisodeSort}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sort episodes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="episode_asc">Episode ↑</SelectItem>
                      <SelectItem value="episode_desc">Episode ↓</SelectItem>
                      <SelectItem value="unwatched_first">Unwatched First</SelectItem>
                      <SelectItem value="watched_first">Watched First</SelectItem>
                      <SelectItem value="air_date_asc">Air Date ↑</SelectItem>
                      <SelectItem value="air_date_desc">Air Date ↓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoadingEpisodes ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : sortedSeasons.length > 0 ? (
                  <Accordion type="multiple" defaultValue={sortedSeasons.map(([season]) => `season-${season}`)}>
                    {sortedSeasons.map(([season, data]) => {
                      const seasonProgress = data.episodes.length > 0 
                        ? Math.round((data.watchedCount / data.episodes.length) * 100) 
                        : 0;

                      // Sort episodes within season based on selected sort
                      const sortedEpisodes = [...data.episodes].sort((a, b) => {
                        switch (episodeSort) {
                          case 'episode_desc':
                            return b.episode_number - a.episode_number;
                          case 'unwatched_first':
                            if (a.is_watched !== b.is_watched) return a.is_watched ? 1 : -1;
                            return a.episode_number - b.episode_number;
                          case 'watched_first':
                            if (a.is_watched !== b.is_watched) return a.is_watched ? -1 : 1;
                            return a.episode_number - b.episode_number;
                          case 'air_date_asc':
                            return (a.air_date || '').localeCompare(b.air_date || '');
                          case 'air_date_desc':
                            return (b.air_date || '').localeCompare(a.air_date || '');
                          case 'episode_asc':
                          default:
                            return a.episode_number - b.episode_number;
                        }
                      });
                      
                      return (
                        <AccordionItem key={season} value={`season-${season}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">Season {season}</span>
                                <Badge variant="outline">
                                  {data.watchedCount}/{data.episodes.length} watched
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{seasonProgress}%</span>
                                {user && isTracking && data.watchedCount < data.episodes.length && (
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markSeasonWatched(parseInt(season));
                                    }}
                                    disabled={isMarkingSeasonWatched}
                                  >
                                    {isMarkingSeasonWatched ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {sortedEpisodes.map((episode) => (
                                <Card key={episode.id} className={`transition-colors ${episode.is_watched ? 'bg-muted/50' : ''}`}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium">
                                            Episode {episode.episode_number}: {episode.title}
                                          </span>
                                          {episode.is_watched && (
                                            <Badge variant="default" className="text-xs">
                                              Watched
                                            </Badge>
                                          )}
                                        </div>
                                        {episode.air_date && (
                                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span>{new Date(episode.air_date).toLocaleDateString()}</span>
                                          </div>
                                        )}
                                      </div>
                                      {user && isTracking && (
                                        <Button
                                          size="sm"
                                          variant={episode.is_watched ? "default" : "outline"}
                                          onClick={() => toggleWatchStatus({ 
                                            episodeId: episode.id, 
                                            watched: !episode.is_watched 
                                          })}
                                        >
                                          {episode.is_watched ? (
                                            <>
                                              <EyeOff className="h-4 w-4 mr-1" />
                                              Unwatch
                                            </>
                                          ) : (
                                            <>
                                              <Eye className="h-4 w-4 mr-1" />
                                              Mark Watched
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <TvIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Episodes Found</h3>
                      <p className="text-muted-foreground">
                        Episodes for this show haven't been added yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}